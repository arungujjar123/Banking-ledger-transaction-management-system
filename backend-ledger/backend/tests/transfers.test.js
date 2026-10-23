const h = require("./helpers")
const ledgerModel = require("../src/models/ledger.model")
const transactionModel = require("../src/models/transaction.model")

let admin, alice, bob

beforeAll(h.connectTestDb)
afterAll(h.disconnectTestDb)

beforeEach(async () => {
    await h.resetDb()
    admin = await h.createAdmin()
    alice = await h.createUser({ name: "Alice Rao" })
    bob = await h.createUser({ name: "Bob Das" })
    await h.fund(admin, alice.accountIds[0], 1000)
})

describe("POST /api/transactions", () => {
    test("moves money and writes one debit and one credit", async () => {
        const res = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 250.5 })

        expect(res.status).toBe(201)
        expect(res.body.transaction).toMatchObject({ amount: 250.5, status: "COMPLETED" })
        expect(await h.balanceOf(alice.accountIds[0])).toBe(749.5)
        expect(await h.balanceOf(bob.accountIds[0])).toBe(250.5)

        const entries = await ledgerModel.find({ transaction: res.body.transaction._id })
        expect(entries.map((e) => e.type).sort()).toEqual([ "CREDIT", "DEBIT" ])
        expect(await h.ledgerIsBalanced()).toBe(true)
    })

    test("rejects a transfer larger than the balance and writes nothing", async () => {
        const res = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 1000.01 })

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/Insufficient balance/)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(1000)
        expect(await transactionModel.countDocuments({ fromAccount: alice.accountIds[0] })).toBe(0)
    })

    test.each([
        [ "a negative amount", { amount: -5 } ],
        [ "a zero amount", { amount: 0 } ],
        [ "more than 2 decimal places", { amount: 1.234 } ],
        [ "a non-numeric amount", { amount: "abc" } ],
        [ "a malformed account ID", { toAccount: "123" } ],
        [ "the same account on both sides", { toAccount: "SELF" } ],
        [ "a missing idempotency key", { idempotencyKey: "" } ]
    ])("rejects %s with 400", async (_, override) => {
        const body = { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 10, ...override }
        if (body.toAccount === "SELF") body.toAccount = alice.accountIds[0]

        const res = await h.transfer(alice.token, body)
        expect(res.status).toBe(400)
    })

    test("returns 404 for an unknown receiver", async () => {
        const res = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: "6adb0b980b905bafd35e2c99", amount: 10 })
        expect(res.status).toBe(404)
    })

    test("forbids sending from someone else's account", async () => {
        const res = await h.transfer(bob.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 10 })

        expect(res.status).toBe(403)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(1000)
    })

    test("rejects a receiver that is not active yet", async () => {
        const pending = await h.createUser({ status: "PENDING" })
        const res = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: pending.accountIds[0], amount: 10 })

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/receiving account is not active/)
    })

    test("rejects a sender that is frozen", async () => {
        const frozen = await h.createUser({ status: "FROZEN" })
        const res = await h.transfer(frozen.token, { fromAccount: frozen.accountIds[0], toAccount: bob.accountIds[0], amount: 1 })

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/sending account is not active/)
    })

    test("requires authentication", async () => {
        const res = await h.api().post("/api/transactions").send({ fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 1, idempotencyKey: "x" })
        expect(res.status).toBe(401)
    })
})

describe("ledger immutability", () => {
    test("ledger entries cannot be updated or deleted", async () => {
        const entry = await ledgerModel.findOne()

        await expect(ledgerModel.updateOne({ _id: entry._id }, { amount: 1 })).rejects.toThrow(/immutable/)
        await expect(ledgerModel.deleteOne({ _id: entry._id })).rejects.toThrow(/immutable/)
        await expect(ledgerModel.findOneAndUpdate({ _id: entry._id }, { amount: 1 })).rejects.toThrow(/immutable/)
    })
})
