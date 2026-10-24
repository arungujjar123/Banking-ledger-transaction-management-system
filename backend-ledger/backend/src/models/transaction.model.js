const mongoose = require("mongoose")


const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [ true, "Transaction must be associated with a from account" ],
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [ true, "Transaction must be associated with a to account" ],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: [ "PENDING", "COMPLETED", "FAILED", "REVERSED" ],
            message: "Status can be either PENDING, COMPLETED, FAILED or REVERSED",
        },
        default: "PENDING"
    },
    // Integer paise (₹1,500.50 is stored as 150050)
    amount: {
        type: Number,
        required: [ true, "Amount is required for creating a transaction" ],
        min: [ 1, "Transaction amount must be positive" ],
        validate: {
            validator: Number.isInteger,
            message: "Amount must be a whole number of paise"
        },
    },
    idempotencyKey: {
        type: String,
        required: [ true, "Idempotency Key is required for creating a transaction" ],
        index: true,
        unique: true
    },
    // Set only on reversals: the transaction this one undoes, why, and which admin did it
    reversalOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction"
    },
    reason: {
        type: String,
        trim: true,
        maxlength: [ 500, "Reason must be at most 500 characters" ]
    },
    reversedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }
}, {
    timestamps: true
})

// A transaction can be reversed at most once: even if two reversals race past every other
// check, the database lets only one of them commit
transactionSchema.index(
    { reversalOf: 1 },
    { unique: true, partialFilterExpression: { reversalOf: { $exists: true } } }
)

const transactionModel = mongoose.model("transaction", transactionSchema)


module.exports = transactionModel   