const mongoose = require("mongoose")
const transactionModel = require("../models/transaction.model")
const { TransferError } = require("./transfer.service")
const { formatRupees } = require("../utils/money")

const IST_OFFSET_MS = 330 * 60 * 1000

// Limits are set in whole rupees through the environment and used in paise
const rupeesFromEnv = (name, fallbackRupees) => {
    const rupees = Number(process.env[ name ])
    return (Number.isSafeInteger(rupees) && rupees > 0 ? rupees : fallbackRupees) * 100
}

/**
 * - Limits on transfers users make (admin funding and reversals are not limited):
 *   - maxTransfer: largest single transfer
 *   - dailyLimit: total a single account may send per day (IST)
 *   - approvalThreshold: transfers above this wait for an admin's approval
 * - Read on every call, so a changed environment variable applies without code changes
 */
function getTransferLimits() {
    return {
        maxTransfer: rupeesFromEnv("MAX_TRANSFER_RUPEES", 100000),
        dailyLimit: rupeesFromEnv("DAILY_TRANSFER_LIMIT_RUPEES", 100000),
        approvalThreshold: rupeesFromEnv("APPROVAL_THRESHOLD_RUPEES", 25000)
    }
}

// Midnight in India, as a UTC instant: the daily limit resets then, not at UTC midnight
function startOfTodayIST(now = new Date()) {
    const istNow = new Date(now.getTime() + IST_OFFSET_MS)
    istNow.setUTCHours(0, 0, 0, 0)
    return new Date(istNow.getTime() - IST_OFFSET_MS)
}

/**
 * - What an account has sent today towards its daily limit: completed transfers (also ones
 *   reversed later) and transfers still awaiting approval, so waiting for an admin cannot be
 *   used to queue up more than the limit. Rejected transfers and reversals do not count.
 */
async function sentToday(accountId, session) {
    const [ result ] = await transactionModel.aggregate([
        {
            $match: {
                fromAccount: new mongoose.Types.ObjectId(String(accountId)),
                createdAt: { $gte: startOfTodayIST() },
                status: { $in: [ "COMPLETED", "REVERSED", "AWAITING_APPROVAL" ] },
                reversalOf: { $exists: false }
            }
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).session(session ?? null)

    return result?.total ?? 0
}

/**
 * - Throws when this transfer would take the account over its daily limit. Call it after the
 *   sender is locked (afterLock), so parallel transfers cannot each see the old total.
 */
async function assertWithinDailyLimit(accountId, amount, session) {
    const { dailyLimit } = getTransferLimits()
    const remaining = Math.max(dailyLimit - await sentToday(accountId, session), 0)

    if (amount > remaining) {
        throw new TransferError(400, `This transfer exceeds your daily limit of ${formatRupees(dailyLimit)}. You can send ${formatRupees(remaining)} more today.`)
    }
}

module.exports = {
    getTransferLimits,
    startOfTodayIST,
    sentToday,
    assertWithinDailyLimit
}
