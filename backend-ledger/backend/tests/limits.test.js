const mongoose = require("mongoose")
const h = require("./helpers")
const accountModel = require("../src/models/account.model")
const ledgerModel = require("../src/models/ledger.model")
const transactionModel = require("../src/models/transaction.model")
const { startOfTodayIST } = require("../src/services/limits.service")

let admin, alice, bob, from, to

// The defaults: ₹1,00,000 per transfer, ₹1,00,000 per account per day, approval above ₹25,000
beforeAll(() => {
    delete process.env.MAX_TRANSFER_RUPEES
    delete process.env.DAILY_TRANSFER_LIMIT_RUPEES
    delete process.env.APPROVAL_THRESHOLD_RUPEES
})
beforeAll(h.connectTestDb)
afterAll(h.disconnectTestDb)

beforeEach(async () => {
    await h.resetDb()
    admin = await h.createAdmin()
    alice = await h.createUser({ name: "Alice Rao" })
    bob = await h.createUser({ name: "Bob Das" })
    from = alice.accountIds[0]
    to = bob.accountIds[0]
    await h.fund(admin, from, 30000000) // ₹3,00,000
})

const send = (amount, extra = {}) => h.transfer(alice.token, { fromAccount: from, toAccount: to, amount, ...extra })
const asAdmin = (req) => req.set("Authorization", `Bearer ${admin.token}`)
const approve = (id, token = admin.token) => h.api().post(`/api/admin/approvals/${id}/approve`).set("Authorization", `Bearer ${token}`)
const reject = (id, reason = "Could not verify the recipient") =>
    asAdmin(h.api().post(`/api/admin/approvals/${id}/reject`)).send({ reason })
const limitsOf = (accountId, token = alice.token) =>
    h.api().get(`/api/transactions/limits/${accountId}`).set("Authorization", `Bearer ${token}`)
const parallel = (n, fn) => Promise.all(Array.from({ length: n }, (_, i) => fn(i)))

describe("transfer limits", () => {
    test("a single transfer above ₹1,00,000 is rejected", async () => {
        const res = await send(10000001)

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("A single transfer can be at most ₹1,00,000.00")
    })

    test("an account can send at most ₹1,00,000 per day", async () => {
        for (let i = 0; i < 5; i++) {
            expect((await send(2000000)).status).toBe(201) // ₹20,000
        }

        const over = await send(100)

        expect(over.status).toBe(400)
        expect(over.body.message).toBe("This transfer exceeds your daily limit of ₹1,00,000.00. You can send ₹0.00 more today.")
        expect(await h.balanceOf(to)).toBe(10000000)
    })

    test("parallel transfers cannot go over the daily limit together", async () => {
        const results = await parallel(8, () => send(2000000))

        expect(results.filter((r) => r.status === 201)).toHaveLength(5)
        expect(results.filter((r) => r.status === 400)).toHaveLength(3)
        expect(await h.balanceOf(to)).toBe(10000000)
    })

    test("transfers from before midnight IST do not count", async () => {
        await mongoose.connection.db.collection("transactions").insertOne({
            fromAccount: new mongoose.Types.ObjectId(from),
            toAccount: new mongoose.Types.ObjectId(to),
            amount: 10000000,
            status: "COMPLETED",
            idempotencyKey: h.randomUUID(),
            createdAt: new Date(startOfTodayIST().getTime() - 60 * 1000)
        })

        expect((await send(2000000)).status).toBe(201)
    })

    test("the limits endpoint shows what is left today, for the owner only", async () => {
        await send(2000000)

        const res = await limitsOf(from)
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ maxTransfer: 10000000, dailyLimit: 10000000, approvalThreshold: 2500000, sentToday: 2000000, remainingToday: 8000000 })

        expect((await limitsOf(from, bob.token)).status).toBe(404)
    })

    test("admin funding is not limited", async () => {
        const res = await asAdmin(h.api().post("/api/transactions/system/initial-funds"))
            .send({ toAccount: to, amount: 50000000, idempotencyKey: h.randomUUID() })

        expect(res.status).toBe(201)
    })
})

describe("maker-checker approval", () => {
    test("a transfer above ₹25,000 waits for approval and moves no money", async () => {
        const res = await send(3000000) // ₹30,000

        expect(res.status).toBe(202)
        expect(res.body.transaction).toMatchObject({ status: "AWAITING_APPROVAL", requestedBy: alice.user._id.toString() })
        expect(await h.balanceOf(from)).toBe(30000000)
        expect(await ledgerModel.countDocuments({ transaction: res.body.transaction._id })).toBe(0)

        // It already counts towards today's limit
        expect((await limitsOf(from)).body.remainingToday).toBe(7000000)
    })

    test("₹25,000 exactly does not need approval", async () => {
        expect((await send(2500000)).status).toBe(201)
    })

    test("replaying the key returns the waiting transfer", async () => {
        const idempotencyKey = h.randomUUID()
        const first = await send(3000000, { idempotencyKey })
        const replay = await send(3000000, { idempotencyKey })

        expect(replay.status).toBe(200)
        expect(replay.body.transaction._id).toBe(first.body.transaction._id)
        expect(await transactionModel.countDocuments({ status: "AWAITING_APPROVAL" })).toBe(1)
    })

    test("approving moves the money once and records the admin", async () => {
        const pending = (await send(3000000)).body.transaction

        const res = await approve(pending._id)

        expect(res.status).toBe(200)
        expect(res.body.transaction).toMatchObject({ status: "COMPLETED", reviewedBy: admin.user._id.toString() })
        expect(await h.balanceOf(from)).toBe(27000000)
        expect(await h.balanceOf(to)).toBe(3000000)
        expect(await h.ledgerIsBalanced()).toBe(true)

        const again = await approve(pending._id)
        expect(again.status).toBe(409)
        expect(await h.balanceOf(to)).toBe(3000000)
    })

    test("rejecting keeps the money where it is, and the user sees why", async () => {
        const pending = (await send(3000000)).body.transaction

        const res = await reject(pending._id)
        expect(res.status).toBe(200)
        expect(res.body.transaction).toMatchObject({ status: "REJECTED", rejectionReason: "Could not verify the recipient" })
        expect((await approve(pending._id)).status).toBe(409)
        expect(await h.balanceOf(from)).toBe(30000000)

        // A rejected transfer gives its share of the daily limit back
        expect((await limitsOf(from)).body.remainingToday).toBe(10000000)

        const mine = await h.api().get("/api/transactions/approvals").set("Authorization", `Bearer ${alice.token}`)
        expect(mine.body.transactions).toEqual([ expect.objectContaining({ status: "REJECTED", rejectionReason: "Could not verify the recipient" }) ])
    })

    test("parallel approvals and rejections let exactly one decision through", async () => {
        const pending = (await send(3000000)).body.transaction

        const results = await parallel(6, (i) => (i % 2 === 0 ? approve(pending._id) : reject(pending._id)))

        expect(results.filter((r) => r.status === 200)).toHaveLength(1)
        expect(results.filter((r) => r.status === 409)).toHaveLength(5)

        const { status } = await transactionModel.findById(pending._id)
        expect(await h.balanceOf(to)).toBe(status === "COMPLETED" ? 3000000 : 0)
        expect(await ledgerModel.countDocuments({ transaction: pending._id })).toBe(status === "COMPLETED" ? 2 : 0)
    })

    test("approval fails and the transfer keeps waiting if the sender no longer has the money", async () => {
        const carol = await h.createUser({ name: "Carol" })
        await h.fund(admin, carol.accountIds[0], 4000000) // ₹40,000
        const pending = (await h.transfer(carol.token, { fromAccount: carol.accountIds[0], toAccount: to, amount: 3000000 })).body.transaction
        await h.transfer(carol.token, { fromAccount: carol.accountIds[0], toAccount: to, amount: 2000000 })

        const res = await approve(pending._id)

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Insufficient balance. Available balance is ₹20,000.00")
        expect((await transactionModel.findById(pending._id)).status).toBe("AWAITING_APPROVAL")
    })

    test("approval fails if the sender was frozen in the meantime", async () => {
        const pending = (await send(3000000)).body.transaction
        await accountModel.updateOne({ _id: from }, { status: "FROZEN" })

        expect((await approve(pending._id)).status).toBe(400)
        expect((await transactionModel.findById(pending._id)).status).toBe("AWAITING_APPROVAL")
    })

    test("admins see the queue with who asked; users cannot review", async () => {
        const pending = (await send(3000000)).body.transaction

        const queue = await asAdmin(h.api().get("/api/admin/approvals"))
        expect(queue.body.transactions).toEqual([ expect.objectContaining({ _id: pending._id, requestedBy: expect.objectContaining({ name: "Alice Rao" }) }) ])

        expect((await approve(pending._id, alice.token)).status).toBe(403)
        expect((await h.api().get("/api/admin/approvals").set("Authorization", `Bearer ${alice.token}`)).status).toBe(403)
    })

    test("bad review requests are rejected", async () => {
        const pending = (await send(3000000)).body.transaction

        expect((await approve("not-an-id")).status).toBe(400)
        expect((await approve("6adb0b980b905bafd35e2c99")).status).toBe(404)
        expect((await reject(pending._id, "")).status).toBe(400)
        expect((await transactionModel.findById(pending._id)).status).toBe("AWAITING_APPROVAL")
    })
})
