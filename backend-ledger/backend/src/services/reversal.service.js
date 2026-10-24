const accountModel = require("../models/account.model")
const transactionModel = require("../models/transaction.model")
const userModel = require("../models/user.model")
const { TransferError, executeTransfer, findByIdempotencyKey } = require("./transfer.service")

const isSameId = (a, b) => String(a) === String(b)

// The system reserve may go negative (it funds users), so reversing money into a user
// from the reserve must not be blocked by the reserve's balance
async function isSystemAccount(accountId) {
    const account = await accountModel.findById(accountId).lean()
    return Boolean(account && await userModel.exists({ _id: account.user, systemUser: true }))
}

/**
 * - Undo a completed transfer by writing the opposite transfer: the original receiver is
 *   debited and the original sender credited, with the same amount. Ledger entries are never
 *   edited or deleted; the reversal is a new, linked transaction.
 * - In one MongoDB transaction: the reversal's record and two ledger entries are written and
 *   the original is marked REVERSED, or nothing changes.
 * - Fails (and changes nothing) if the original receiver no longer has the money.
 * - Frozen accounts can be reversed: freezing and then reversing is the usual fraud flow.
 * - Replaying the idempotency key returns the first reversal.
 */
async function reverseTransaction({ transactionId, reason, idempotencyKey, adminId }) {
    const replay = await findReplay(idempotencyKey, transactionId)
    if (replay) {
        return replay
    }

    const original = await transactionModel.findById(transactionId).lean()

    if (!original) {
        throw new TransferError(404, "Transaction not found")
    }
    if (original.reversalOf) {
        throw new TransferError(400, "A reversal cannot itself be reversed")
    }
    if (original.status !== "COMPLETED") {
        throw new TransferError(409, `Only completed transactions can be reversed; this one is ${original.status}`)
    }

    try {
        const result = await executeTransfer({
            fromAccountId: original.toAccount,
            toAccountId: original.fromAccount,
            amount: original.amount,
            idempotencyKey,
            allowNegative: await isSystemAccount(original.toAccount),
            requireActiveSender: false,
            requireActiveReceiver: false,
            fields: { reversalOf: original._id, reason, reversedBy: adminId },
            // Flip the original only if it is still COMPLETED: a reversal that committed in the
            // meantime makes this one fail instead of moving the money back twice. Checked before
            // the balance, so a losing request hears "already reversed", not "insufficient balance".
            afterLock: async (session) => {
                const { modifiedCount } = await transactionModel.updateOne(
                    { _id: original._id, status: "COMPLETED" },
                    { status: "REVERSED" },
                    { session }
                )
                if (modifiedCount !== 1) {
                    throw new TransferError(409, "This transaction has already been reversed")
                }
            }
        })

        if (result.replayed && !isSameId(result.transaction.reversalOf, transactionId)) {
            throw new TransferError(409, "This idempotency key was already used for a different transaction")
        }
        return result
    } catch (err) {
        const lostRace = err.status === 409 || (err.code === 11000 && err.keyPattern?.reversalOf)
        if (!lostRace) {
            throw err
        }

        // The same request sent twice at once: answer the loser with the winner's reversal
        const winner = await findReplay(idempotencyKey, transactionId)
        if (winner) {
            return winner
        }
        throw err.status ? err : new TransferError(409, "This transaction has already been reversed")
    }
}

async function findReplay(idempotencyKey, transactionId) {
    const existing = await findByIdempotencyKey(idempotencyKey)

    if (!existing) {
        return null
    }
    if (!isSameId(existing.reversalOf, transactionId)) {
        throw new TransferError(409, "This idempotency key was already used for a different transaction")
    }
    return { transaction: existing, replayed: true }
}

module.exports = {
    reverseTransaction
}
