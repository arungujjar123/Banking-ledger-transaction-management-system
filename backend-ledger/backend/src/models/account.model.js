const mongoose = require("mongoose")
const ledgerModel = require("./ledger.model")
const balanceSnapshotModel = require("./balanceSnapshot.model")

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [ true, "Account must be associated with a user" ],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: [ "PENDING", "ACTIVE", "FROZEN", "CLOSED" ],
            message: "Status can be either PENDING, ACTIVE, FROZEN or CLOSED",
        },
        default: "PENDING"
    },
    currency: {
        type: String,
        required: [ true, "Currency is required for creating an account" ],
        default: "INR"
    },
    // Incremented by every outgoing transfer so concurrent transfers from the same
    // account conflict inside MongoDB transactions (see services/transfer.service.js)
    lockVersion: {
        type: Number,
        default: 0,
        select: false
    }
}, {
    timestamps: true
})

accountSchema.index({ user: 1, status: 1 })

/**
 * - Balance = credits - debits over the account's ledger entries
 * - Starts from the account's latest balance snapshot, if any, and adds only the entries
 *   written since; without a snapshot every entry is summed
 * - Pass a session to read the balance inside a transaction (sees that transaction's snapshot)
 */
accountSchema.methods.getBalance = async function (session) {
    const snapshot = await balanceSnapshotModel.findOne({ account: this._id }).session(session ?? null).lean()

    const [ result ] = await ledgerModel.aggregate([
        { $match: { account: this._id, ...(snapshot && { createdAt: { $gte: snapshot.asOf } }) } },
        { $group: { _id: null, total: { $sum: ledgerModel.signedAmount } } }
    ]).session(session ?? null)

    return (snapshot?.balance ?? 0) + (result?.total ?? 0)
}

const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel