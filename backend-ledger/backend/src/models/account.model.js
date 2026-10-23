const mongoose = require("mongoose")
const ledgerModel = require("./ledger.model")

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

// Pass a session to read the balance inside a transaction (sees that transaction's snapshot)
accountSchema.methods.getBalance = async function (session) {
    const pipeline = ledgerModel.aggregate([
        { $match: { account: this._id } },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: [ "$type", "DEBIT" ] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: [ "$type", "CREDIT" ] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: [ "$totalCredit", "$totalDebit" ] }
            }
        }
    ])

    if (session) {
        pipeline.session(session)
    }

    const balanceData = await pipeline

    if (balanceData.length === 0) {
        return 0
    }

    return balanceData[ 0 ].balance
}

const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel