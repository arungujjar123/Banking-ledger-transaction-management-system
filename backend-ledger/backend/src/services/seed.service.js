const mongoose = require("mongoose")
const userModel = require("../models/user.model")
const accountModel = require("../models/account.model")
const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")

/**
 * - Create the system admin user and its ACTIVE system account if missing
 * - Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD env variables
 * - Safe to run on every startup (idempotent)
 */
async function ensureAdminUser() {
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD

    if (!email || !password) {
        console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed")
        return null
    }

    let adminUser = await userModel.findOne({ email }).select("+systemUser")

    if (!adminUser) {
        adminUser = await userModel.create({
            name: "System Admin",
            email,
            password,
            systemUser: true
        })
        console.log("Admin user created:", email)
    }

    let adminAccount = await accountModel.findOne({ user: adminUser._id })

    if (!adminAccount) {
        adminAccount = await accountModel.create({
            user: adminUser._id,
            status: "ACTIVE",
            currency: "INR"
        })
        console.log("Admin system account created:", adminAccount._id.toString())
    }

    return { adminUser, adminAccount }
}

/**
 * - Record a completed transfer with its DEBIT and CREDIT ledger entries
 */
async function createSeedTransfer({ fromAccount, toAccount, amount, idempotencyKey }, session) {
    const [ transaction ] = await transactionModel.create([ {
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "COMPLETED"
    } ], { session })

    await ledgerModel.create([
        { account: fromAccount, amount, transaction: transaction._id, type: "DEBIT" },
        { account: toAccount, amount, transaction: transaction._id, type: "CREDIT" }
    ], { session, ordered: true })
}

/**
 * - Create a public demo user with two ACTIVE accounts and some history
 * - Credentials come from DEMO_EMAIL / DEMO_PASSWORD env variables
 * - Funding is keyed by idempotency key, so it happens exactly once
 */
async function ensureDemoUser(adminAccount) {
    const email = process.env.DEMO_EMAIL
    const password = process.env.DEMO_PASSWORD

    if (!email || !password) {
        console.log("DEMO_EMAIL / DEMO_PASSWORD not set, skipping demo seed")
        return null
    }

    if (!adminAccount) {
        console.log("Admin account missing, skipping demo seed")
        return null
    }

    let demoUser = await userModel.findOne({ email }).select("+systemUser")

    if (demoUser?.systemUser) {
        console.log("DEMO_EMAIL belongs to an admin user, skipping demo seed")
        return null
    }

    if (!demoUser) {
        demoUser = await userModel.create({
            name: "Demo User",
            email,
            password
        })
        console.log("Demo user created:", email)
    }

    let accounts = await accountModel.find({ user: demoUser._id }).sort({ createdAt: 1 })

    while (accounts.length < 2) {
        accounts.push(await accountModel.create({ user: demoUser._id, status: "ACTIVE" }))
    }

    await accountModel.updateMany({ user: demoUser._id }, { status: "ACTIVE" })

    const [ primary, savings ] = accounts
    const fundingKey = `seed-demo-initial-${demoUser._id}`

    if (await transactionModel.exists({ idempotencyKey: fundingKey })) {
        return { demoUser }
    }

    const session = await mongoose.startSession()

    try {
        await session.withTransaction(async () => {
            await createSeedTransfer({
                fromAccount: adminAccount._id,
                toAccount: primary._id,
                amount: 50000,
                idempotencyKey: fundingKey
            }, session)

            await createSeedTransfer({
                fromAccount: primary._id,
                toAccount: savings._id,
                amount: 5000,
                idempotencyKey: `seed-demo-transfer-${demoUser._id}`
            }, session)
        })
        console.log("Demo user funded")
    } finally {
        await session.endSession()
    }

    return { demoUser }
}

module.exports = {
    ensureAdminUser,
    ensureDemoUser
}
