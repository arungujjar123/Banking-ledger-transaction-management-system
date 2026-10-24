const ledgerModel = require("../models/ledger.model")
const balanceSnapshotModel = require("../models/balanceSnapshot.model")
const { startOfTodayIST } = require("./limits.service")

// A snapshot only covers entries at least this old. createdAt is set when an entry is written,
// but the entry becomes visible only when its MongoDB transaction commits, and MongoDB aborts
// transactions after 60 seconds. Anything older than 5 minutes is therefore committed already;
// a newer entry could still be in flight and would be missed by both the snapshot and the reads
// that start after it.
const SAFETY_MARGIN_MS = 5 * 60 * 1000

const DAY_MS = 24 * 60 * 60 * 1000
// 00:10 IST, so the snapshot (which stops 5 minutes earlier) covers the whole previous day
const DAILY_RUN_OFFSET_MS = 10 * 60 * 1000

/**
 * - Store every account's balance from the entries written before `now - 5 minutes`,
 *   replacing the previous snapshot. Safe to run at any time, also twice at once.
 */
async function takeBalanceSnapshots(now = new Date()) {
    const asOf = new Date(now.getTime() - SAFETY_MARGIN_MS)

    const balances = await ledgerModel.aggregate([
        { $match: { $or: [ { createdAt: { $lt: asOf } }, { createdAt: { $exists: false } } ] } },
        { $group: { _id: "$account", balance: { $sum: ledgerModel.signedAmount }, entryCount: { $sum: 1 } } }
    ])

    if (balances.length > 0) {
        await balanceSnapshotModel.bulkWrite(balances.map(({ _id, balance, entryCount }) => ({
            updateOne: {
                filter: { account: _id },
                update: { $set: { balance, entryCount, asOf, takenAt: now } },
                upsert: true
            }
        })))
    }

    return { accounts: balances.length, asOf, takenAt: now }
}

// The next 00:10 in India after `now`
function nextDailyRun(now = new Date()) {
    const todayRun = new Date(startOfTodayIST(now).getTime() + DAILY_RUN_OFFSET_MS)
    return todayRun > now ? todayRun : new Date(todayRun.getTime() + DAY_MS)
}

/**
 * - Take snapshots every day at 00:10 IST while the server runs. Render's free plan has no
 *   cron jobs, so this lives in the web process; admins can also take one from the
 *   reconciliation page.
 */
function scheduleDailySnapshots() {
    const run = () => {
        takeBalanceSnapshots()
            .then(({ accounts, asOf }) => console.log(`Balance snapshot taken for ${accounts} accounts as of ${asOf.toISOString()}`))
            .catch((err) => console.error("Balance snapshot failed:", err.message))
            .finally(schedule)
    }
    const schedule = () => {
        setTimeout(run, nextDailyRun().getTime() - Date.now()).unref()
    }

    schedule()
}

module.exports = {
    SAFETY_MARGIN_MS,
    takeBalanceSnapshots,
    nextDailyRun,
    scheduleDailySnapshots
}
