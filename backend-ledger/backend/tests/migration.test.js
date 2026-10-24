const mongoose = require("mongoose")
const h = require("./helpers")
const { MIGRATION_ID, migrateAmountsToPaise } = require("../src/migrations/amountsToPaise")

let admin, alice

beforeAll(h.connectTestDb)
beforeAll(() => jest.spyOn(console, "log").mockImplementation(() => {}))
afterAll(h.disconnectTestDb)

// Writes a transfer the way the old code stored it: amounts in rupees with up to 2 decimals
async function insertRupeeTransfer(from, to, rupees) {
    const db = mongoose.connection.db
    const { insertedId } = await db.collection("transactions").insertOne({
        fromAccount: new mongoose.Types.ObjectId(from),
        toAccount: new mongoose.Types.ObjectId(to),
        amount: rupees,
        status: "COMPLETED",
        idempotencyKey: h.randomUUID()
    })
    await db.collection("ledgers").insertMany([
        { account: new mongoose.Types.ObjectId(from), amount: rupees, transaction: insertedId, type: "DEBIT" },
        { account: new mongoose.Types.ObjectId(to), amount: rupees, transaction: insertedId, type: "CREDIT" }
    ])
}

beforeEach(async () => {
    await h.resetDb()
    admin = await h.createAdmin()
    alice = await h.createUser({ name: "Alice Rao" })

    await insertRupeeTransfer(admin.accountIds[0], alice.accountIds[0], 1000.07)
    await insertRupeeTransfer(admin.accountIds[0], alice.accountIds[0], 250.5)
})

describe("amounts-to-paise migration", () => {
    test("converts rupee amounts to exact integer paise", async () => {
        expect(await migrateAmountsToPaise()).toBe(true)

        const amounts = await mongoose.connection.db.collection("ledgers").distinct("amount")
        expect(amounts.sort((a, b) => a - b)).toEqual([ 25050, 100007 ])
        expect(await h.balanceOf(alice.accountIds[0])).toBe(125057)
        expect(await h.balanceOf(admin.accountIds[0])).toBe(-125057)
        expect(await h.ledgerIsBalanced()).toBe(true)
    })

    test("runs only once, even if started again or by two instances together", async () => {
        const results = await Promise.all([ migrateAmountsToPaise(), migrateAmountsToPaise() ])
        expect(results.filter(Boolean)).toHaveLength(1)

        expect(await migrateAmountsToPaise()).toBe(false)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(125057)
        expect(await mongoose.connection.db.collection("migrations").countDocuments({ _id: MIGRATION_ID })).toBe(1)
    })

    test("new transfers after the migration add up with the converted history", async () => {
        await migrateAmountsToPaise()

        const bob = await h.createUser({ name: "Bob Das" })
        const res = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 25057 })

        expect(res.status).toBe(201)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(100000)
    })
})
