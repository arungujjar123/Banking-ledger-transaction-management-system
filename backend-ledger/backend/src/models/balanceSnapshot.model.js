const mongoose = require("mongoose")

/**
 * - An account's balance from every ledger entry written before `asOf`, so reading a balance
 *   only has to add the entries written since, instead of every entry the account ever had.
 * - Ledger entries are immutable, so a snapshot never goes stale; it only falls behind.
 * - Entries without createdAt (saved before timestamps were enabled) are older than any
 *   snapshot and always belong to it.
 * - One per account, replaced by each new snapshot (services/snapshot.service.js).
 */
const balanceSnapshotSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true,
        unique: true
    },
    // Integer paise; negative for the system reserve
    balance: {
        type: Number,
        required: true
    },
    asOf: {
        type: Date,
        required: true
    },
    entryCount: Number,
    takenAt: Date
})

const balanceSnapshotModel = mongoose.model("balanceSnapshot", balanceSnapshotSchema)

module.exports = balanceSnapshotModel
