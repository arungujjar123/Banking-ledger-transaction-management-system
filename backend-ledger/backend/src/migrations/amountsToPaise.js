const mongoose = require("mongoose")

const MIGRATION_ID = "2026-10-amounts-to-paise"

/**
 * - One-time data migration: amounts used to be stored as rupees (1500.5) and are now integer
 *   paise (150050). Multiplies every existing transaction and ledger amount by 100.
 * - Runs at most once: a marker document is inserted in the same MongoDB transaction as the
 *   updates, so a restart (or two instances starting together) can never apply it twice.
 * - Writes through the raw collections on purpose. The ledger model's immutability hooks
 *   exist to stop application code from editing entries; a schema migration is the one
 *   deliberate exception.
 * - Returns true when it applied the migration, false when it had already been applied.
 */
async function migrateAmountsToPaise() {
    const db = mongoose.connection.db
    const migrations = db.collection("migrations")

    if (await migrations.findOne({ _id: MIGRATION_ID })) {
        return false
    }

    const toPaise = [ { $set: { amount: { $round: [ { $multiply: [ "$amount", 100 ] }, 0 ] } } } ]
    const session = await mongoose.startSession()

    try {
        let counts
        await session.withTransaction(async () => {
            await migrations.insertOne({ _id: MIGRATION_ID, appliedAt: new Date() }, { session })
            const transactions = await db.collection("transactions").updateMany({}, toPaise, { session })
            const ledgers = await db.collection("ledgers").updateMany({}, toPaise, { session })
            counts = { transactions: transactions.modifiedCount, ledgers: ledgers.modifiedCount }
        })
        console.log(`Migration ${MIGRATION_ID} applied:`, counts)
        return true
    } catch (err) {
        // Another instance inserted the marker first and is applying (or applied) it
        if (err.code === 11000) {
            return false
        }
        throw err
    } finally {
        await session.endSession()
    }
}

module.exports = {
    MIGRATION_ID,
    migrateAmountsToPaise
}
