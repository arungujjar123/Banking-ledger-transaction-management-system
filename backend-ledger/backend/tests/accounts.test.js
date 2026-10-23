const h = require("./helpers")
const maskName = require("../src/utils/maskName")

let admin, alice, bob

beforeAll(h.connectTestDb)
afterAll(h.disconnectTestDb)

beforeEach(async () => {
    await h.resetDb()
    admin = await h.createAdmin()
    alice = await h.createUser({ name: "Alice Rao", accounts: 2 })
    bob = await h.createUser({ name: "Bob Kumar Das" })
    await h.fund(admin, alice.accountIds[0], 500)
})

const as = (user, req) => req.set("Authorization", `Bearer ${user.token}`)

describe("balances", () => {
    test("the owner can read a balance derived from the ledger", async () => {
        const res = await as(alice, h.api().get(`/api/accounts/balance/${alice.accountIds[0]}`))

        expect(res.status).toBe(200)
        expect(res.body.balance).toBe(500)
    })

    test("other users cannot read it", async () => {
        const res = await as(bob, h.api().get(`/api/accounts/balance/${alice.accountIds[0]}`))
        expect(res.status).toBe(404)
    })
})

describe("GET /api/accounts/lookup/:accountId", () => {
    test("returns a masked owner name and status", async () => {
        const res = await as(alice, h.api().get(`/api/accounts/lookup/${bob.accountIds[0]}`))

        expect(res.status).toBe(200)
        expect(res.body).toEqual({ accountId: bob.accountIds[0], ownerName: "Bob D.", status: "ACTIVE", isOwnAccount: false })
    })

    test("flags the caller's own account", async () => {
        const res = await as(alice, h.api().get(`/api/accounts/lookup/${alice.accountIds[1]}`))
        expect(res.body.isOwnAccount).toBe(true)
    })

    test("400 for a malformed ID and 404 for an unknown one", async () => {
        expect((await as(alice, h.api().get("/api/accounts/lookup/not-an-id"))).status).toBe(400)
        expect((await as(alice, h.api().get("/api/accounts/lookup/6adb0b980b905bafd35e2c99"))).status).toBe(404)
    })
})

describe("GET /api/accounts/ledger", () => {
    test("each entry carries the other side of its transfer", async () => {
        await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 120 })

        const res = await as(alice, h.api().get("/api/accounts/ledger"))
        const debit = res.body.entries.find((e) => e.type === "DEBIT")
        const credit = res.body.entries.find((e) => e.type === "CREDIT")

        expect(debit.counterpartyAccount).toBe(bob.accountIds[0])
        expect(credit.counterpartyAccount).toBe(admin.accountIds[0])
        expect(typeof debit.transaction).toBe("string")
    })
})

describe("maskName", () => {
    test.each([
        [ "Rahul Kumar Sharma", "Rahul S." ],
        [ "Demo User", "Demo U." ],
        [ "Arun", "Arun" ],
        [ "  priya   nair  ", "priya N." ],
        [ "", "Account holder" ],
        [ undefined, "Account holder" ]
    ])("%p -> %p", (input, expected) => {
        expect(maskName(input)).toBe(expected)
    })
})
