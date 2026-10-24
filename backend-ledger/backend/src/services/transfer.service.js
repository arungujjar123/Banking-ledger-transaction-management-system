const mongoose = require("mongoose")
const accountModel = require("../models/account.model")
const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const { formatRupees } = require("../utils/money")

/**
 * - An expected business failure (insufficient funds, inactive account, ...)
 * - `status` is the HTTP status the controller should answer with
 */
class TransferError extends Error {
    constructor(status, message) {
        super(message)
        this.status = status
    }
}

function findByIdempotencyKey(idempotencyKey) {
    return transactionModel.findOne({ idempotencyKey }).lean()
}

/**
 * - Lock the sender and run every check a transfer needs, inside the caller's MongoDB
 *   transaction. Throws a TransferError when the transfer must not happen.
 * - Locking: writing to the sender's account document makes concurrent transfers from the same
 *   account conflict. MongoDB aborts the loser with a WriteConflict and withTransaction retries
 *   it, so it re-reads the balance after the winner commits. Without this write, two transfers
 *   insert different ledger rows, never conflict, and both pass the balance check (write skew),
 *   letting the balance go negative.
 */
async function lockAndCheck(session, {
    fromAccountId,
    toAccountId,
    amount,
    ownerId,
    allowNegative = false,
    requireActiveSender = true,
    requireActiveReceiver = true,
    afterLock
}) {
    const sender = await accountModel.findOneAndUpdate(
        { _id: fromAccountId, ...(requireActiveSender && { status: "ACTIVE" }), ...(ownerId && { user: ownerId }) },
        { $inc: { lockVersion: 1 } },
        { session, new: true }
    )

    if (!sender) {
        throw requireActiveSender
            ? new TransferError(400, "The sending account is not active")
            : new TransferError(404, "Sender account not found")
    }

    if (afterLock) {
        await afterLock(session)
    }

    const receiver = await accountModel.findById(toAccountId).session(session)

    if (!receiver) {
        throw new TransferError(404, "Receiver account not found")
    }

    if (requireActiveReceiver && receiver.status !== "ACTIVE") {
        throw new TransferError(400, "The receiving account is not active")
    }

    if (!allowNegative) {
        const balance = await sender.getBalance(session)

        if (balance < amount) {
            throw new TransferError(400, `Insufficient balance. Available balance is ${formatRupees(balance)}`)
        }
    }
}

// The double entry: one DEBIT and one CREDIT of the same amount
function writeLedgerEntries(session, { _id, fromAccount, toAccount, amount }) {
    return ledgerModel.create([
        { account: fromAccount, amount, transaction: _id, type: "DEBIT" },
        { account: toAccount, amount, transaction: _id, type: "CREDIT" }
    ], { session, ordered: true })
}

/**
 * - Move money between two accounts as one atomic double-entry transfer
 * - Everything happens inside one MongoDB transaction: either the transaction record and
 *   both ledger entries are written, or nothing is
 * - Replaying an idempotency key returns the original transaction instead of moving money again
 *
 * Options (besides those of lockAndCheck):
 * - ownerId: when set, the sender account must belong to this user
 * - allowNegative: skip the balance check (system reserve account funding users)
 * - requireActiveSender / requireActiveReceiver: reject accounts that are not ACTIVE
 * - fields: extra fields stored on the transaction record
 * - afterLock(session): runs inside the MongoDB transaction right after the sender is locked,
 *   before the other checks; throwing aborts everything
 * - awaitApproval: record the transfer as AWAITING_APPROVAL without moving money; an admin
 *   completes it later (see services/approval.service.js)
 */
async function executeTransfer({ idempotencyKey, fields = {}, awaitApproval = false, ...transfer }) {
    const existing = await findByIdempotencyKey(idempotencyKey)
    if (existing) {
        return { transaction: existing, replayed: true }
    }

    const session = await mongoose.startSession()

    try {
        let transaction

        // withTransaction commits on success, aborts on any error, and retries the whole
        // callback on transient errors such as write conflicts
        await session.withTransaction(async () => {
            await lockAndCheck(session, transfer)

            const [ created ] = await transactionModel.create([ {
                ...fields,
                fromAccount: transfer.fromAccountId,
                toAccount: transfer.toAccountId,
                amount: transfer.amount,
                idempotencyKey,
                status: awaitApproval ? "AWAITING_APPROVAL" : "COMPLETED"
            } ], { session })
            transaction = created

            if (!awaitApproval) {
                await writeLedgerEntries(session, transaction)
            }
        })

        return { transaction: transaction.toObject(), replayed: false }
    } catch (err) {
        // Two requests with the same key raced past the check above; the unique index let
        // only one commit, so answer with that one
        if (err.code === 11000 && err.keyPattern?.idempotencyKey) {
            const winner = await findByIdempotencyKey(idempotencyKey)
            if (winner) {
                return { transaction: winner, replayed: true }
            }
        }
        throw err
    } finally {
        await session.endSession()
    }
}

module.exports = {
    TransferError,
    executeTransfer,
    findByIdempotencyKey,
    lockAndCheck,
    writeLedgerEntries
}
