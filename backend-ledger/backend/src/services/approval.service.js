const mongoose = require("mongoose")
const transactionModel = require("../models/transaction.model")
const { TransferError, lockAndCheck, writeLedgerEntries } = require("./transfer.service")

// Why a review could not happen: the transaction is missing, or someone already decided
async function reviewConflict(transactionId) {
    const transaction = await transactionModel.findById(transactionId).lean()
    return transaction
        ? new TransferError(409, `This transfer was already reviewed; it is ${transaction.status}`)
        : new TransferError(404, "Transaction not found")
}

/**
 * - Approve a transfer that is AWAITING_APPROVAL: in one MongoDB transaction it is flipped to
 *   COMPLETED and its ledger entries are written, after the same checks as any transfer
 *   (the sender is locked, both accounts must be active, the sender must still have the money).
 * - If a check fails, nothing changes and the transfer keeps waiting; the admin can reject it.
 * - At most once: the flip only matches a transfer that is still waiting, so two admins
 *   approving together (or approve racing reject) let exactly one decision through.
 */
async function approveTransfer({ transactionId, adminId }) {
    const session = await mongoose.startSession()

    try {
        let transaction

        await session.withTransaction(async () => {
            transaction = await transactionModel.findOneAndUpdate(
                { _id: transactionId, status: "AWAITING_APPROVAL" },
                { status: "COMPLETED", reviewedBy: adminId, reviewedAt: new Date() },
                { session, new: true }
            )

            if (!transaction) {
                throw await reviewConflict(transactionId)
            }

            await lockAndCheck(session, {
                fromAccountId: transaction.fromAccount,
                toAccountId: transaction.toAccount,
                amount: transaction.amount
            })

            await writeLedgerEntries(session, transaction)
        })

        return transaction.toObject()
    } finally {
        await session.endSession()
    }
}

/**
 * - Reject a transfer that is AWAITING_APPROVAL; no money ever moved, so nothing else changes
 */
async function rejectTransfer({ transactionId, adminId, reason }) {
    const transaction = await transactionModel.findOneAndUpdate(
        { _id: transactionId, status: "AWAITING_APPROVAL" },
        { status: "REJECTED", reviewedBy: adminId, reviewedAt: new Date(), rejectionReason: reason },
        { new: true }
    ).lean()

    if (!transaction) {
        throw await reviewConflict(transactionId)
    }
    return transaction
}

module.exports = {
    approveTransfer,
    rejectTransfer
}
