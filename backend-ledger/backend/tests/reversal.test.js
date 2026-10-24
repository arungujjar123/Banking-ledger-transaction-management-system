const h = require("./helpers")
const accountModel = require("../src/models/account.model")
const transactionModel = require("../src/models/transaction.model")

let admin, alice, bob, original

beforeAll(h.connectTestDb)
afterAll(h.disconnectTestDb)

beforeEach(async () => {
    await h.resetDb()
    admin = await h.createAdmin()
    alice = await h.createUser({ name: "Alice Rao" })
    bob = await h.createUser({ name: "Bob Das" })
    await h.fund(admin, alice.accountIds[0], 100000)

    const res = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 25050 })
    original = res.body.transaction
})

const reverse = (transactionId, body = {}, token = admin.token) =>
    h.api()
        .post(`/api/admin/transactions/${transactionId}/reverse`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Sent to the wrong account", idempotencyKey: h.randomUUID(), ...body })

const parallel = (n, fn) => Promise.all(Array.from({ length: n }, (_, i) => fn(i)))

describe("POST /api/admin/transactions/:id/reverse", () => {
    test("moves the money back with a new, linked transaction and marks the original REVERSED", async () => {
        const res = await reverse(original._id)

        expect(res.status).toBe(201)
        expect(res.body.transaction).toMatchObject({
            fromAccount: bob.accountIds[0],
            toAccount: alice.accountIds[0],
            amount: 25050,
            status: "COMPLETED",
            reversalOf: original._id,
            reason: "Sent to the wrong account",
            reversedBy: admin.user._id.toString()
        })
        expect(await h.balanceOf(alice.accountIds[0])).toBe(100000)
        expect(await h.balanceOf(bob.accountIds[0])).toBe(0)
        expect((await transactionModel.findById(original._id)).status).toBe("REVERSED")
        expect(await h.ledgerIsBalanced()).toBe(true)
    })

    test("cannot reverse the same transaction twice", async () => {
        await reverse(original._id)
        const again = await reverse(original._id)

        expect(again.status).toBe(409)
        expect(await h.balanceOf(bob.accountIds[0])).toBe(0)
    })

    test("five parallel reversals move the money back once", async () => {
        // Bob could afford several reversals, so only the reversal guards can stop the extras
        await h.fund(admin, bob.accountIds[0], 500000)

        const results = await parallel(5, () => reverse(original._id))

        expect(results.filter((r) => r.status === 201)).toHaveLength(1)
        expect(results.filter((r) => r.status === 409)).toHaveLength(4)
        expect(await transactionModel.countDocuments({ reversalOf: original._id })).toBe(1)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(100000)
        expect(await h.balanceOf(bob.accountIds[0])).toBe(500000)
        expect(await h.ledgerIsBalanced()).toBe(true)
    })

    test("replaying the idempotency key returns the first reversal, even in parallel", async () => {
        const idempotencyKey = h.randomUUID()
        const results = await parallel(3, () => reverse(original._id, { idempotencyKey }))

        expect(results.filter((r) => r.status === 201)).toHaveLength(1)
        expect(results.filter((r) => r.status === 200)).toHaveLength(2)
        expect(new Set(results.map((r) => r.body.transaction._id)).size).toBe(1)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(100000)
    })

    test("reusing a reversal's key for another transaction is rejected", async () => {
        const idempotencyKey = h.randomUUID()
        await reverse(original._id, { idempotencyKey })

        const other = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 100 })
        const res = await reverse(other.body.transaction._id, { idempotencyKey })

        expect(res.status).toBe(409)
        expect((await transactionModel.findById(other.body.transaction._id)).status).toBe("COMPLETED")
    })

    test("a reversal cannot itself be reversed", async () => {
        const reversal = (await reverse(original._id)).body.transaction
        const res = await reverse(reversal._id)

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/cannot itself be reversed/)
    })

    test("fails and changes nothing when the receiver has already spent the money", async () => {
        const carol = await h.createUser({ name: "Carol" })
        await h.transfer(bob.token, { fromAccount: bob.accountIds[0], toAccount: carol.accountIds[0], amount: 20000 })

        const res = await reverse(original._id)

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Insufficient balance. Available balance is ₹50.50")
        expect(await h.balanceOf(bob.accountIds[0])).toBe(5050)
        expect((await transactionModel.findById(original._id)).status).toBe("COMPLETED")
        expect(await transactionModel.countDocuments({ reversalOf: original._id })).toBe(0)
    })

    test("works on frozen accounts, the usual flow after a fraud report", async () => {
        await accountModel.updateMany({}, { status: "FROZEN" })

        const res = await reverse(original._id)

        expect(res.status).toBe(201)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(100000)
    })

    test("can reverse a funding from the system reserve, which may go negative", async () => {
        const carol = await h.createUser({ name: "Carol" })
        const funding = await h.api()
            .post("/api/transactions/system/initial-funds")
            .set("Authorization", `Bearer ${admin.token}`)
            .send({ toAccount: carol.accountIds[0], amount: 7000, idempotencyKey: h.randomUUID() })

        expect((await reverse(funding.body.transaction._id)).status).toBe(201)
        expect(await h.balanceOf(carol.accountIds[0])).toBe(0)
    })

    test("money sent to the reserve can be reversed even though the reserve is negative", async () => {
        const toReserve = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: admin.accountIds[0], amount: 1000 })

        expect((await reverse(toReserve.body.transaction._id)).status).toBe(201)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(74950)
    })

    test.each([
        [ "a missing reason", { reason: "" } ],
        [ "a reason that is not a string", { reason: { $ne: null } } ],
        [ "a missing idempotency key", { idempotencyKey: "" } ]
    ])("rejects %s with 400", async (_, body) => {
        expect((await reverse(original._id, body)).status).toBe(400)
        expect((await transactionModel.findById(original._id)).status).toBe("COMPLETED")
    })

    test("400 for a malformed ID and 404 for an unknown one", async () => {
        expect((await reverse("not-an-id")).status).toBe(400)
        expect((await reverse("6adb0b980b905bafd35e2c99")).status).toBe(404)
    })

    test("is forbidden for normal users, even the receiver", async () => {
        const res = await reverse(original._id, {}, bob.token)

        expect(res.status).toBe(403)
        expect(await h.balanceOf(bob.accountIds[0])).toBe(25050)
    })

    test("the user's ledger marks the reversal entries", async () => {
        await reverse(original._id)

        const res = await h.api().get("/api/accounts/ledger").set("Authorization", `Bearer ${alice.token}`)
        const reversalCredit = res.body.entries.find((e) => e.reversalOf)

        expect(reversalCredit).toMatchObject({ type: "CREDIT", amount: 25050, reversalOf: original._id, counterpartyAccount: bob.accountIds[0] })
        expect(res.body.entries.filter((e) => e.reversalOf)).toHaveLength(1)
    })
})
