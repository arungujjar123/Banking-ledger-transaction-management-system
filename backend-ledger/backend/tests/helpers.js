const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const request = require("supertest")
const { randomUUID } = require("crypto")

// Emails are a side effect of transfers; tests never talk to an SMTP server
jest.mock("../src/services/email.service", () => ({
    sendRegistrationEmail: jest.fn().mockResolvedValue(),
    sendTransactionEmail: jest.fn().mockResolvedValue(),
    sendTransactionFailureEmail: jest.fn().mockResolvedValue()
}))

const app = require("../src/app")
const userModel = require("../src/models/user.model")
const accountModel = require("../src/models/account.model")
const ledgerModel = require("../src/models/ledger.model")
const { executeTransfer } = require("../src/services/transfer.service")

const api = () => request(app)
// Keeps cookies between requests, like a browser
const agent = () => request.agent(app)

/**
 * - Connect to the test database. Tests drop this database, so refuse anything
 *   whose name does not say "test" (protects a real database from a wrong URI)
 */
async function connectTestDb() {
    const uri = process.env.TEST_MONGO_URI
    const dbName = new URL(uri.replace(/^mongodb(\+srv)?:/, "http:")).pathname.slice(1)

    if (!/test/i.test(dbName)) {
        throw new Error(`Refusing to run tests against database "${dbName}": its name must contain "test"`)
    }

    await mongoose.connect(uri)
}

// Fresh database with every index in place (the idempotency key's unique index matters
// for the concurrency tests, and creating collections up front keeps them out of transactions)
async function resetDb() {
    await mongoose.connection.dropDatabase()
    await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()))
}

async function disconnectTestDb() {
    await mongoose.disconnect()
}

const tokenFor = (user) => jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" })

/**
 * - Create a user with `accounts` accounts in the given status; returns the user, a JWT
 *   and the account ids
 */
async function createUser({ name = "Test User", email, status = "ACTIVE", accounts = 1, systemUser = false } = {}) {
    const user = await userModel.create({
        name,
        email: email || `user-${randomUUID()}@test.local`,
        password: "secret123",
        systemUser
    })

    const created = []
    for (let i = 0; i < accounts; i++) {
        created.push(await accountModel.create({ user: user._id, status }))
    }

    return { user, token: tokenFor(user), accountIds: created.map((a) => a._id.toString()) }
}

const createAdmin = () => createUser({ name: "System Admin", email: `admin-${randomUUID()}@test.local`, systemUser: true })

// Put money into an account the same way the admin "initial funds" flow does
async function fund(admin, accountId, amount) {
    await executeTransfer({
        fromAccountId: admin.accountIds[0],
        toAccountId: accountId,
        amount,
        idempotencyKey: randomUUID(),
        allowNegative: true,
        requireActiveReceiver: false
    })
}

async function balanceOf(accountId) {
    const account = await accountModel.findById(accountId)
    return account.getBalance()
}

const transfer = (token, body) =>
    api()
        .post("/api/transactions")
        .set("Authorization", `Bearer ${token}`)
        .send({ idempotencyKey: randomUUID(), ...body })

// Every transaction must have exactly one DEBIT and one CREDIT of the same amount
async function ledgerIsBalanced() {
    const [ unbalanced ] = await ledgerModel.aggregate([
        {
            $group: {
                _id: "$transaction",
                entries: { $sum: 1 },
                debit: { $sum: { $cond: [ { $eq: [ "$type", "DEBIT" ] }, "$amount", 0 ] } },
                credit: { $sum: { $cond: [ { $eq: [ "$type", "CREDIT" ] }, "$amount", 0 ] } }
            }
        },
        { $match: { $or: [ { entries: { $ne: 2 } }, { $expr: { $ne: [ "$debit", "$credit" ] } } ] } },
        { $count: "n" }
    ])
    return !unbalanced
}

module.exports = {
    api,
    agent,
    connectTestDb,
    resetDb,
    disconnectTestDb,
    tokenFor,
    createUser,
    createAdmin,
    fund,
    balanceOf,
    transfer,
    ledgerIsBalanced,
    randomUUID
}
