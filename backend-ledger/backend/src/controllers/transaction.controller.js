const mongoose = require("mongoose")
const accountModel = require("../models/account.model")
const transactionModel = require("../models/transaction.model")
const emailService = require("../services/email.service")
const { TransferError, executeTransfer } = require("../services/transfer.service")
const { getTransferLimits, sentToday, assertWithinDailyLimit } = require("../services/limits.service")
const { isValidPaise, formatRupees } = require("../utils/money")

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i

/**
 * - Validate the shared transfer fields; returns an error message or null
 */
function validateTransferInput({ fromAccount, toAccount, amount, idempotencyKey }) {
    if (!toAccount || amount === undefined || amount === null || !idempotencyKey) {
        return "toAccount, amount and idempotencyKey are required"
    }

    if ((fromAccount !== undefined && !OBJECT_ID_PATTERN.test(fromAccount)) || !OBJECT_ID_PATTERN.test(toAccount)) {
        return "Account IDs must be 24 characters (0-9, a-f)"
    }

    if (fromAccount !== undefined && fromAccount === toAccount) {
        return "Sender and receiver accounts must be different"
    }

    // Amounts are integer paise: 150050 means ₹1,500.50
    if (!isValidPaise(amount)) {
        return "amount must be a positive whole number of paise (e.g. 150050 for ₹1,500.50)"
    }

    if (typeof idempotencyKey !== "string" || idempotencyKey.length > 100) {
        return "idempotencyKey must be a string of at most 100 characters"
    }

    return null
}

/**
 * - A replayed key must describe the same transfer; reusing it for a different one is a client bug
 */
function isSameTransfer(transaction, { fromAccount, toAccount, amount }) {
    return String(transaction.fromAccount) === String(fromAccount)
        && String(transaction.toAccount) === String(toAccount)
        && transaction.amount === amount
}

/**
 * - Turn a service result or error into the HTTP response
 */
function sendTransferResult(res, err, result, expected) {
    if (err) {
        if (err instanceof TransferError) {
            return res.status(err.status).json({ message: err.message })
        }
        console.error("Transfer failed:", err)
        return res.status(500).json({ message: "Transfer failed. No money was moved, please try again." })
    }

    if (result.replayed && !isSameTransfer(result.transaction, expected)) {
        return res.status(409).json({ message: "This idempotency key was already used for a different transfer" })
    }

    if (result.replayed) {
        return res.status(200).json({ message: "Transaction already processed", transaction: result.transaction })
    }

    // 202 Accepted: recorded, but no money moves until an admin approves it
    if (result.transaction.status === "AWAITING_APPROVAL") {
        return res.status(202).json({ message: "Transfer sent for admin approval", transaction: result.transaction })
    }

    return res.status(201).json({ message: "Transaction completed successfully", transaction: result.transaction })
}

/**
 * - POST /api/transactions
 * - Transfer between two accounts; the sender must belong to the logged-in user
 */
async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount) {
        return res.status(400).json({ message: "fromAccount is required" })
    }

    const validationError = validateTransferInput(req.body)
    if (validationError) {
        return res.status(400).json({ message: validationError })
    }

    const fromUserAccount = await accountModel.findById(fromAccount)

    if (!fromUserAccount) {
        return res.status(404).json({ message: "Sender account not found" })
    }

    if (!fromUserAccount.user.equals(req.user._id)) {
        return res.status(403).json({ message: "You can only transfer from your own account" })
    }

    const { maxTransfer, approvalThreshold } = getTransferLimits()

    if (amount > maxTransfer) {
        return res.status(400).json({ message: `A single transfer can be at most ${formatRupees(maxTransfer)}` })
    }

    // Large transfers are recorded now and executed only when an admin approves them
    const awaitApproval = amount > approvalThreshold

    let result
    try {
        result = await executeTransfer({
            fromAccountId: fromAccount,
            toAccountId: toAccount,
            amount,
            idempotencyKey,
            ownerId: req.user._id,
            awaitApproval,
            fields: awaitApproval ? { requestedBy: req.user._id } : {},
            // Checked under the sender lock, so parallel transfers cannot each see the old total
            afterLock: (session) => assertWithinDailyLimit(fromAccount, amount, session)
        })
    } catch (err) {
        return sendTransferResult(res, err)
    }

    // Email is sent after the money has moved and never delays or fails the response
    if (!result.replayed && result.transaction.status === "COMPLETED") {
        emailService.sendTransactionEmail(req.user.email, req.user.name, formatRupees(amount), toAccount)
            .catch((err) => console.error("Transaction email failed:", err.message))
    }

    return sendTransferResult(res, null, result, { fromAccount, toAccount, amount })
}

/**
 * - POST /api/transactions/system/initial-funds
 * - Fund a user account from the system reserve account (system users only).
 *   The reserve may go negative: it is the source of all money in the system.
 */
async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    const validationError = validateTransferInput({ toAccount, amount, idempotencyKey })
    if (validationError) {
        return res.status(400).json({ message: validationError })
    }

    const systemAccount = await accountModel.findOne({ user: req.user._id })

    if (!systemAccount) {
        return res.status(400).json({ message: "System user account not found" })
    }

    if (systemAccount._id.equals(toAccount)) {
        return res.status(400).json({ message: "Cannot fund the system reserve account from itself" })
    }

    let result
    try {
        result = await executeTransfer({
            fromAccountId: systemAccount._id,
            toAccountId: toAccount,
            amount,
            idempotencyKey,
            allowNegative: true,
            requireActiveReceiver: false
        })
    } catch (err) {
        return sendTransferResult(res, err)
    }

    return sendTransferResult(res, null, result, { fromAccount: systemAccount._id, toAccount, amount })
}

/**
 * - GET /api/transactions/limits/:accountId
 * - The transfer limits, and how much of today's limit this account has used
 */
async function getLimitsController(req, res) {
    const { accountId } = req.params

    if (!OBJECT_ID_PATTERN.test(accountId)) {
        return res.status(400).json({ message: "Account IDs must be 24 characters (0-9, a-f)" })
    }

    const account = await accountModel.findOne({ _id: accountId, user: req.user._id })
    if (!account) {
        return res.status(404).json({ message: "Account not found" })
    }

    const limits = getTransferLimits()
    const sent = await sentToday(account._id)

    return res.status(200).json({
        ...limits,
        sentToday: sent,
        remainingToday: Math.max(limits.dailyLimit - sent, 0)
    })
}

/**
 * - GET /api/transactions/approvals
 * - The user's transfers that are waiting for an admin, or were rejected in the last 30 days
 */
async function getMyApprovalRequestsController(req, res) {
    const accountIds = (await accountModel.find({ user: req.user._id }).lean()).map((a) => a._id)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const transactions = await transactionModel.find({
        fromAccount: mongoose.trusted({ $in: accountIds }),
        $or: [
            { status: "AWAITING_APPROVAL" },
            { status: "REJECTED", reviewedAt: mongoose.trusted({ $gte: since }) }
        ]
    }).sort({ createdAt: -1 }).limit(20).lean()

    return res.status(200).json({ transactions })
}

module.exports = {
    getLimitsController,
    getMyApprovalRequestsController,
    createTransaction,
    createInitialFundsTransaction
}
