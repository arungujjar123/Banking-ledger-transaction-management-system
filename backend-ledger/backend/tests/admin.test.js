const h = require("./helpers")
const accountModel = require("../src/models/account.model")

let admin, alice

beforeAll(h.connectTestDb)
afterAll(h.disconnectTestDb)

beforeEach(async () => {
    await h.resetDb()
    admin = await h.createAdmin()
    alice = await h.createUser({ name: "Alice Rao", status: "PENDING" })
})

const asAdmin = (req) => req.set("Authorization", `Bearer ${admin.token}`)

describe("admin routes", () => {
    test.each([
        [ "get", "/api/admin/users" ],
        [ "get", "/api/admin/ledger" ],
        [ "get", "/api/admin/transactions" ],
        [ "get", "/api/admin/blocked-tokens" ],
        [ "patch", "/api/admin/users/6adb0b980b905bafd35e2c99/status" ]
    ])("%s %s is forbidden for normal users", async (method, path) => {
        const res = await h.api()[method](path).set("Authorization", `Bearer ${alice.token}`).send({ status: "ACTIVE" })
        expect(res.status).toBe(403)
    })

    test("lists users with their account status", async () => {
        const res = await asAdmin(h.api().get("/api/admin/users"))

        expect(res.status).toBe(200)
        expect(res.body.users.find((u) => u.name === "Alice Rao").status).toBe("PENDING")
    })

    test("approves a pending user", async () => {
        const res = await asAdmin(h.api().patch(`/api/admin/users/${alice.user._id}/status`)).send({ status: "ACTIVE" })

        expect(res.status).toBe(200)
        expect((await accountModel.findById(alice.accountIds[0])).status).toBe("ACTIVE")
    })

    test("rejects an invalid status", async () => {
        const res = await asAdmin(h.api().patch(`/api/admin/users/${alice.user._id}/status`)).send({ status: "SUSPENDED" })
        expect(res.status).toBe(400)
    })
})

describe("POST /api/transactions/system/initial-funds", () => {
    const fund = (token, body) =>
        h.api().post("/api/transactions/system/initial-funds").set("Authorization", `Bearer ${token}`).send({ idempotencyKey: h.randomUUID(), ...body })

    test("funds an account from the reserve, which may go negative", async () => {
        const res = await fund(admin.token, { toAccount: alice.accountIds[0], amount: 250050 })

        expect(res.status).toBe(201)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(250050)
        expect(await h.balanceOf(admin.accountIds[0])).toBe(-250050)
    })

    test("replaying the key does not credit twice", async () => {
        const idempotencyKey = h.randomUUID()
        await fund(admin.token, { toAccount: alice.accountIds[0], amount: 10000, idempotencyKey })
        const replay = await fund(admin.token, { toAccount: alice.accountIds[0], amount: 10000, idempotencyKey })

        expect(replay.status).toBe(200)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(10000)
    })

    test("cannot fund the reserve from itself", async () => {
        const res = await fund(admin.token, { toAccount: admin.accountIds[0], amount: 10000 })
        expect(res.status).toBe(400)
    })

    test("is forbidden for normal users", async () => {
        const res = await fund(alice.token, { toAccount: alice.accountIds[0], amount: 10000 })
        expect(res.status).toBe(403)
    })
})
