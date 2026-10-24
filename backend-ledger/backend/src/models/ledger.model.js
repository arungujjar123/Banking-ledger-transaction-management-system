const mongoose = require('mongoose');


const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [ true, "Ledger must be associated with an account" ],
        index: true,
        immutable: true
    },
    // Integer paise (₹1,500.50 is stored as 150050)
    amount: {
        type: Number,
        required: [ true, "Amount is required for creating a ledger entry" ],
        min: [ 1, "Ledger amount must be positive" ],
        validate: {
            validator: Number.isInteger,
            message: "Amount must be a whole number of paise"
        },
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: [ true, "Ledger must be associated with a transaction" ],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: [ "CREDIT", "DEBIT" ],
            message: "Type can be either CREDIT or DEBIT",
        },
        required: [ true, "Ledger type is required" ],
        immutable: true
    }
}, {
    timestamps: true
})


function preventLedgerModification() {
    throw new Error("Ledger entries are immutable and cannot be modified or deleted");
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);


// Balances read a snapshot plus the entries written after it (see balanceSnapshot.model.js)
ledgerSchema.index({ account: 1, createdAt: 1 });

const ledgerModel = mongoose.model('ledger', ledgerSchema);

// Aggregation expression: credits add to a balance, debits subtract
ledgerModel.signedAmount = { $cond: [ { $eq: [ "$type", "CREDIT" ] }, "$amount", { $subtract: [ 0, "$amount" ] } ] };

module.exports = ledgerModel;