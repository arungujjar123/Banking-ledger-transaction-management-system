const h = require("./helpers")
const transactionModel = require("../src/models/transaction.model")

let admin, alice, bob

beforeAll(h.connectTestDb)
afterAll(h.disconnectTestDb)

beforeEach(async () => {
    await h.resetDb()
    admin = await h.createAdmin()
    alice = await h.createUser({ name: "Alice Rao" })
    bob = await h.createUser({ name: "Bob Das" })
})

const parallel = (n, fn) => Promise.all(Array.from({ length: n }, (_, i) => fn(i)))

describe("double spending", () => {
    test("only one of five parallel transfers that each need most of the balance succeeds", async () => {
        await h.fund(admin, alice.accountIds[0], 45000)

        const results = await parallel(5, () =>
            h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 40000 }))

        expect(results.filter((r) => r.status === 201)).toHaveLength(1)
        expect(results.filter((r) => r.status === 400)).toHaveLength(4)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(5000)
        expect(await h.balanceOf(bob.accountIds[0])).toBe(40000)
    })

    test("twenty parallel transfers never overspend", async () => {
        await h.fund(admin, alice.accountIds[0], 9100)

        const results = await parallel(20, () =>
            h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 1000 }))

        expect(results.filter((r) => r.status === 201)).toHaveLength(9)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(100)
        expect(await h.ledgerIsBalanced()).toBe(true)
    })

    test("parallel admin fundings into one account are all applied", async () => {
        await parallel(4, () => h.fund(admin, alice.accountIds[0], 1000))
        expect(await h.balanceOf(alice.accountIds[0])).toBe(4000)
    })
})

describe("idempotency", () => {
    beforeEach(() => h.fund(admin, alice.accountIds[0], 1000))

    test("replaying a key returns the original transaction and moves money once", async () => {
        const body = { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 100, idempotencyKey: h.randomUUID() }

        const first = await h.transfer(alice.token, body)
        const replay = await h.transfer(alice.token, body)

        expect(first.status).toBe(201)
        expect(replay.status).toBe(200)
        expect(replay.body.transaction._id).toBe(first.body.transaction._id)
        expect(await h.balanceOf(bob.accountIds[0])).toBe(100)
    })

    test("the same key sent five times in parallel creates one transaction", async () => {
        const body = { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 100, idempotencyKey: h.randomUUID() }

        const results = await parallel(5, () => h.transfer(alice.token, body))

        expect(new Set(results.map((r) => r.body.transaction?._id)).size).toBe(1)
        expect(results.filter((r) => r.status === 201)).toHaveLength(1)
        expect(await transactionModel.countDocuments({ idempotencyKey: body.idempotencyKey })).toBe(1)
        expect(await h.balanceOf(bob.accountIds[0])).toBe(100)
    })

    test("reusing a key for a different transfer is rejected with 409", async () => {
        const idempotencyKey = h.randomUUID()
        await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 100, idempotencyKey })

        const reuse = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 999, idempotencyKey })

        expect(reuse.status).toBe(409)
        expect(await h.balanceOf(bob.accountIds[0])).toBe(100)
    })
})
