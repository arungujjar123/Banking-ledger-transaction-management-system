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
 * - Move money between two accounts as one atomic double-entry transfer
 * - Everything happens inside one MongoDB transaction: either the transaction record and
 *   both ledger entries are written, or nothing is
 * - Replaying an idempotency key returns the original transaction instead of moving money again
 *
 * Options:
 * - ownerId: when set, the sender account must belong to this user
 * - allowNegative: skip the balance check (system reserve account funding users)
 * - requireActiveReceiver: reject receivers that are not ACTIVE
 */
async function executeTransfer({
    fromAccountId,
    toAccountId,
    amount,
    idempotencyKey,
    ownerId,
    allowNegative = false,
    requireActiveReceiver = true
}) {
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
            // Lock the sender: writing to its account document makes concurrent transfers from
            // the same account conflict. MongoDB aborts the loser with a WriteConflict and
            // withTransaction retries it, so it re-reads the balance after the winner commits.
            // Without this write, two transfers insert different ledger rows, never conflict,
            // and both pass the balance check (write skew), letting the balance go negative.
            const sender = await accountModel.findOneAndUpdate(
                { _id: fromAccountId, status: "ACTIVE", ...(ownerId && { user: ownerId }) },
                { $inc: { lockVersion: 1 } },
                { session, new: true }
            )

            if (!sender) {
                throw new TransferError(400, "The sending account is not active")
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

            [ transaction ] = await transactionModel.create([ {
                fromAccount: fromAccountId,
                toAccount: toAccountId,
                amount,
                idempotencyKey,
                status: "COMPLETED"
            } ], { session })

            await ledgerModel.create([
                { account: fromAccountId, amount, transaction: transaction._id, type: "DEBIT" },
                { account: toAccountId, amount, transaction: transaction._id, type: "CREDIT" }
            ], { session, ordered: true })
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
    executeTransfer
}
