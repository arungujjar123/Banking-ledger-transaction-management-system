const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const { TransferError, executeTransfer } = require("../services/transfer.service")

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

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

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !AMOUNT_PATTERN.test(String(amount))) {
        return "Amount must be greater than 0 with at most 2 decimal places"
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

    return res.status(result.replayed ? 200 : 201).json({
        message: result.replayed ? "Transaction already processed" : "Transaction completed successfully",
        transaction: result.transaction
    })
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

    const numericAmount = Number(amount)
    let result
    try {
        result = await executeTransfer({
            fromAccountId: fromAccount,
            toAccountId: toAccount,
            amount: numericAmount,
            idempotencyKey,
            ownerId: req.user._id
        })
    } catch (err) {
        return sendTransferResult(res, err)
    }

    // Email is sent after the money has moved and never delays or fails the response
    if (!result.replayed) {
        emailService.sendTransactionEmail(req.user.email, req.user.name, numericAmount, toAccount)
            .catch((err) => console.error("Transaction email failed:", err.message))
    }

    return sendTransferResult(res, null, result, { fromAccount, toAccount, amount: numericAmount })
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

    const numericAmount = Number(amount)
    let result
    try {
        result = await executeTransfer({
            fromAccountId: systemAccount._id,
            toAccountId: toAccount,
            amount: numericAmount,
            idempotencyKey,
            allowNegative: true,
            requireActiveReceiver: false
        })
    } catch (err) {
        return sendTransferResult(res, err)
    }

    return sendTransferResult(res, null, result, { fromAccount: systemAccount._id, toAccount, amount: numericAmount })
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}
