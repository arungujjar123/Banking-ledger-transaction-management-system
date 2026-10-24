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
    await h.fund(admin, alice.accountIds[0], 100000) // ₹1,000.00
})

describe("POST /api/transactions", () => {
    test("moves money and writes one debit and one credit", async () => {
        const res = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 25050 })

        expect(res.status).toBe(201)
        expect(res.body.transaction).toMatchObject({ amount: 25050, status: "COMPLETED" })
        expect(await h.balanceOf(alice.accountIds[0])).toBe(74950)
        expect(await h.balanceOf(bob.accountIds[0])).toBe(25050)

        const entries = await ledgerModel.find({ transaction: res.body.transaction._id })
        expect(entries.map((e) => e.type).sort()).toEqual([ "CREDIT", "DEBIT" ])
        expect(await h.ledgerIsBalanced()).toBe(true)
    })

    test("rejects a transfer larger than the balance and writes nothing", async () => {
        const res = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 100001 })

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Insufficient balance. Available balance is ₹1,000.00")
        expect(await h.balanceOf(alice.accountIds[0])).toBe(100000)
        expect(await transactionModel.countDocuments({ fromAccount: alice.accountIds[0] })).toBe(0)
    })

    test.each([
        [ "a negative amount", { amount: -5 } ],
        [ "a zero amount", { amount: 0 } ],
        [ "a fractional number of paise", { amount: 1000.5 } ],
        [ "an amount sent as a string", { amount: "1000" } ],
        [ "a non-numeric amount", { amount: "abc" } ],
        [ "a malformed account ID", { toAccount: "123" } ],
        [ "the same account on both sides", { toAccount: "SELF" } ],
        [ "a missing idempotency key", { idempotencyKey: "" } ]
    ])("rejects %s with 400", async (_, override) => {
        const body = { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 1000, ...override }
        if (body.toAccount === "SELF") body.toAccount = alice.accountIds[0]

        const res = await h.transfer(alice.token, body)
        expect(res.status).toBe(400)
    })

    test("returns 404 for an unknown receiver", async () => {
        const res = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: "6adb0b980b905bafd35e2c99", amount: 1000 })
        expect(res.status).toBe(404)
    })

    test("forbids sending from someone else's account", async () => {
        const res = await h.transfer(bob.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 1000 })

        expect(res.status).toBe(403)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(100000)
    })

    test("rejects a receiver that is not active yet", async () => {
        const pending = await h.createUser({ status: "PENDING" })
        const res = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: pending.accountIds[0], amount: 1000 })

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/receiving account is not active/)
    })

    test("rejects a sender that is frozen", async () => {
        const frozen = await h.createUser({ status: "FROZEN" })
        const res = await h.transfer(frozen.token, { fromAccount: frozen.accountIds[0], toAccount: bob.accountIds[0], amount: 100 })

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/sending account is not active/)
    })

    test("requires authentication", async () => {
        const res = await h.api().post("/api/transactions").send({ fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 1, idempotencyKey: "x" })
        expect(res.status).toBe(401)
    })
})

describe("money is exact", () => {
    test("many small transfers add up without rounding drift", async () => {
        // In floating-point rupees, 0.1 + 0.2 !== 0.3 and errors pile up over many entries
        for (const paise of [ 10, 20, 30, 1, 99, 333, 7 ]) {
            const res = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: paise })
            expect(res.status).toBe(201)
        }

        expect(await h.balanceOf(bob.accountIds[0])).toBe(500)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(99500)
        expect(await h.ledgerIsBalanced()).toBe(true)
    })

    test("the models refuse fractional paise even if the API check is bypassed", async () => {
        await expect(ledgerModel.create({ account: alice.accountIds[0], transaction: bob.accountIds[0], type: "CREDIT", amount: 10.5 }))
            .rejects.toThrow(/whole number of paise/)
        await expect(transactionModel.create({ fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 0.5, idempotencyKey: h.randomUUID() }))
            .rejects.toThrow(/whole number of paise|positive/)
    })
})

describe("ledger immutability", () => {
    test("ledger entries cannot be updated or deleted", async () => {
        const entry = await ledgerModel.findOne()

        await expect(ledgerModel.updateOne({ _id: entry._id }, { amount: 100 })).rejects.toThrow(/immutable/)
        await expect(ledgerModel.deleteOne({ _id: entry._id })).rejects.toThrow(/immutable/)
        await expect(ledgerModel.findOneAndUpdate({ _id: entry._id }, { amount: 100 })).rejects.toThrow(/immutable/)
    })
})
