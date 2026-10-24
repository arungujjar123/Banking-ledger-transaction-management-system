const mongoose = require("mongoose")
const h = require("./helpers")
const balanceSnapshotModel = require("../src/models/balanceSnapshot.model")
const transactionModel = require("../src/models/transaction.model")
const { takeBalanceSnapshots, nextDailyRun } = require("../src/services/snapshot.service")

let admin, alice, bob, firstTransfer, secondTransfer

beforeAll(h.connectTestDb)
afterAll(h.disconnectTestDb)

const raw = (name) => mongoose.connection.db.collection(name)
const asAdmin = (req) => req.set("Authorization", `Bearer ${admin.token}`)
const reconcile = async () => (await asAdmin(h.api().get("/api/admin/reconciliation"))).body
const check = (report, id) => report.checks.find((c) => c.id === id)
const failedChecks = (report) => report.checks.filter((c) => !c.passed).map((c) => c.id).sort()

// Moves the createdAt of every existing ledger entry an hour back, so a snapshot covers them
const ageLedger = () => raw("ledgers").updateMany({}, { $set: { createdAt: new Date(Date.now() - 60 * 60 * 1000) } })

// A realistic ledger: funding, two transfers, a reversal of the first, a rejected request.
// Balances: Alice ₹900.00, Bob ₹100.00
beforeEach(async () => {
    await h.resetDb()
    admin = await h.createAdmin()
    alice = await h.createUser({ name: "Alice Rao" })
    bob = await h.createUser({ name: "Bob Das" })
    await h.fund(admin, alice.accountIds[0], 100000)

    firstTransfer = (await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 25050 })).body.transaction
    secondTransfer = (await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 10000 })).body.transaction
    await asAdmin(h.api().post(`/api/admin/transactions/${firstTransfer._id}/reverse`)).send({ reason: "Wrong account", idempotencyKey: h.randomUUID() })
    await transactionModel.create({ fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 5000, idempotencyKey: h.randomUUID(), status: "REJECTED" })
})

describe("reconciliation report", () => {
    test("a consistent ledger passes every check", async () => {
        await ageLedger()
        await takeBalanceSnapshots()

        const report = await reconcile()

        expect(failedChecks(report)).toEqual([])
        expect(report.passed).toBe(true)
        expect(report.checks).toHaveLength(6)
        expect(check(report, "trial-balance").summary).toBe("Debits ₹1,601.00 · Credits ₹1,601.00")
        expect(check(report, "entries-match-transactions").checked).toBe(4)
        expect(report.snapshots.accounts).toBe(3)
    })

    test("a deleted ledger entry breaks the trial balance and its transfer", async () => {
        const entry = await raw("ledgers").findOne({ transaction: new mongoose.Types.ObjectId(secondTransfer._id), type: "CREDIT" })
        await raw("ledgers").deleteOne({ _id: entry._id })

        const report = await reconcile()

        expect(failedChecks(report)).toEqual([ "entries-match-transactions", "trial-balance" ])
        expect(check(report, "entries-match-transactions").failures).toEqual([ secondTransfer._id ])
        expect(check(report, "trial-balance").failures).toEqual([ "Off by ₹100.00" ])
    })

    test("an entry whose amount differs from its transaction is caught", async () => {
        await raw("ledgers").updateMany({ transaction: new mongoose.Types.ObjectId(secondTransfer._id) }, { $set: { amount: 9000 } })

        const report = await reconcile()

        expect(failedChecks(report)).toEqual([ "entries-match-transactions" ])
    })

    test("money moved for a transfer that is still awaiting approval is caught", async () => {
        const pending = await transactionModel.create({ fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 100, idempotencyKey: h.randomUUID(), status: "AWAITING_APPROVAL" })
        await raw("ledgers").insertMany([
            { account: pending.fromAccount, amount: 100, transaction: pending._id, type: "DEBIT" },
            { account: pending.toAccount, amount: 100, transaction: pending._id, type: "CREDIT" }
        ])

        const report = await reconcile()

        expect(failedChecks(report)).toEqual([ "status-matches-entries" ])
        expect(check(report, "status-matches-entries").failures).toEqual([ pending._id.toString() ])
    })

    test("a second reversal of the same transfer is caught", async () => {
        const reversal = await raw("transactions").findOne({ reversalOf: new mongoose.Types.ObjectId(firstTransfer._id) })
        await raw("transactions").dropIndex("reversalOf_1")
        await raw("transactions").insertOne({ ...reversal, _id: new mongoose.Types.ObjectId(), idempotencyKey: h.randomUUID() })

        const report = await reconcile()

        expect(failedChecks(report)).toContain("reversals-consistent")
        expect(check(report, "reversals-consistent").failures).toEqual([ firstTransfer._id ])
    })

    test("a customer balance below zero is caught, the system reserve is not", async () => {
        const txn = await transactionModel.create({ fromAccount: bob.accountIds[0], toAccount: alice.accountIds[0], amount: 999999, idempotencyKey: h.randomUUID(), status: "COMPLETED" })
        await raw("ledgers").insertMany([
            { account: txn.fromAccount, amount: 999999, transaction: txn._id, type: "DEBIT" },
            { account: txn.toAccount, amount: 999999, transaction: txn._id, type: "CREDIT" }
        ])

        const report = await reconcile()

        expect(failedChecks(report)).toEqual([ "no-negative-balances" ])
        expect(check(report, "no-negative-balances").failures).toEqual([ bob.accountIds[0] ])
    })

    test("a snapshot that disagrees with the ledger is caught", async () => {
        await ageLedger()
        await takeBalanceSnapshots()
        await balanceSnapshotModel.updateOne({ account: alice.accountIds[0] }, { $inc: { balance: 1 } })

        const report = await reconcile()

        expect(failedChecks(report)).toEqual([ "snapshots-match-ledger" ])
        expect(check(report, "snapshots-match-ledger").failures).toEqual([ alice.accountIds[0] ])
    })

    test("is for admins only", async () => {
        expect((await h.api().get("/api/admin/reconciliation").set("Authorization", `Bearer ${alice.token}`)).status).toBe(403)
        expect((await h.api().post("/api/admin/snapshots").set("Authorization", `Bearer ${alice.token}`)).status).toBe(403)
    })
})

describe("balance snapshots", () => {
    test("balances read from a snapshot plus later entries are exact", async () => {
        const before = [ await h.balanceOf(alice.accountIds[0]), await h.balanceOf(bob.accountIds[0]) ]
        await ageLedger()

        const res = await asAdmin(h.api().post("/api/admin/snapshots"))
        expect(res.status).toBe(201)
        expect(res.body.accounts).toBe(3)

        expect(await h.balanceOf(alice.accountIds[0])).toBe(before[ 0 ])
        expect(await h.balanceOf(bob.accountIds[0])).toBe(before[ 1 ])

        // Entries after the snapshot are added on top of it
        await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 1234 })
        expect(await h.balanceOf(alice.accountIds[0])).toBe(before[ 0 ] - 1234)
        expect(await h.balanceOf(bob.accountIds[0])).toBe(before[ 1 ] + 1234)
        expect((await reconcile()).passed).toBe(true)
    })

    test("balances really come from the snapshot", async () => {
        await ageLedger()
        await takeBalanceSnapshots()
        const balance = await h.balanceOf(alice.accountIds[0])

        await balanceSnapshotModel.updateOne({ account: alice.accountIds[0] }, { $inc: { balance: 100 } })

        expect(await h.balanceOf(alice.accountIds[0])).toBe(balance + 100)
    })

    test("entries from the last 5 minutes stay out of the snapshot, in case they are still committing", async () => {
        await takeBalanceSnapshots()

        expect(await balanceSnapshotModel.countDocuments()).toBe(0)
        expect(await h.balanceOf(alice.accountIds[0])).toBe(90000)
    })

    test("transfers still check the balance correctly after a snapshot", async () => {
        await ageLedger()
        await takeBalanceSnapshots()

        const res = await h.transfer(alice.token, { fromAccount: alice.accountIds[0], toAccount: bob.accountIds[0], amount: 90001 })

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("Insufficient balance. Available balance is ₹900.00")
    })

    test("the daily snapshot runs at 00:10 India time", () => {
        expect(nextDailyRun(new Date("2026-10-24T05:00:00Z")).toISOString()).toBe("2026-10-24T18:40:00.000Z")
        expect(nextDailyRun(new Date("2026-10-23T18:45:00Z")).toISOString()).toBe("2026-10-24T18:40:00.000Z")
    })
})
