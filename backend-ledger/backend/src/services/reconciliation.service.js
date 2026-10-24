const ledgerModel = require("../models/ledger.model")
const transactionModel = require("../models/transaction.model")
const accountModel = require("../models/account.model")
const userModel = require("../models/user.model")
const balanceSnapshotModel = require("../models/balanceSnapshot.model")
const { formatRupees } = require("../utils/money")

// How many offending IDs a failed check lists
const SAMPLE_SIZE = 10

const LEDGERS = ledgerModel.collection.name
const TRANSACTIONS = transactionModel.collection.name
const ACCOUNTS = accountModel.collection.name
const USERS = userModel.collection.name

const isDebit = { $eq: [ "$type", "DEBIT" ] }
const ids = (docs) => docs.map((d) => String(d._id))

const result = ({ id, title, description, checked, failures, summary }) => ({
    id,
    title,
    description,
    checked,
    summary,
    passed: failures.length === 0,
    failureCount: failures.length,
    failures: failures.slice(0, SAMPLE_SIZE)
})

// Double entry: across the whole ledger, money in equals money out
async function trialBalance() {
    const [ totals = { debits: 0, credits: 0, entries: 0 } ] = await ledgerModel.aggregate([
        {
            $group: {
                _id: null,
                debits: { $sum: { $cond: [ isDebit, "$amount", 0 ] } },
                credits: { $sum: { $cond: [ isDebit, 0, "$amount" ] } },
                entries: { $sum: 1 }
            }
        }
    ])

    return result({
        id: "trial-balance",
        title: "Debits equal credits",
        description: "Across the whole ledger, the total of all debit entries equals the total of all credit entries.",
        checked: totals.entries,
        summary: `Debits ${formatRupees(totals.debits)} · Credits ${formatRupees(totals.credits)}`,
        failures: totals.debits === totals.credits ? [] : [ `Off by ${formatRupees(Math.abs(totals.debits - totals.credits))}` ]
    })
}

// Every transaction's entries are exactly one debit from its sender and one credit to its receiver
async function entriesMatchTransactions() {
    const groups = await ledgerModel.aggregate([
        { $group: { _id: "$transaction", entries: { $push: { type: "$type", account: "$account", amount: "$amount" } } } },
        { $lookup: { from: TRANSACTIONS, localField: "_id", foreignField: "_id", as: "txn" } },
        {
            $project: {
                found: { $size: "$txn" },
                txn: { $first: "$txn" },
                count: { $size: "$entries" },
                debit: { $first: { $filter: { input: "$entries", cond: { $eq: [ "$$this.type", "DEBIT" ] } } } },
                credit: { $first: { $filter: { input: "$entries", cond: { $eq: [ "$$this.type", "CREDIT" ] } } } }
            }
        },
        {
            $project: {
                ok: {
                    $and: [
                        { $eq: [ "$found", 1 ] },
                        { $eq: [ "$count", 2 ] },
                        { $eq: [ "$debit.amount", "$txn.amount" ] },
                        { $eq: [ "$credit.amount", "$txn.amount" ] },
                        { $eq: [ "$debit.account", "$txn.fromAccount" ] },
                        { $eq: [ "$credit.account", "$txn.toAccount" ] }
                    ]
                }
            }
        }
    ])

    return result({
        id: "entries-match-transactions",
        title: "Each transfer has one matching debit and credit",
        description: "Every transaction's ledger entries are exactly one debit from its sender and one credit to its receiver, both for the transaction's amount.",
        checked: groups.length,
        failures: ids(groups.filter((g) => !g.ok))
    })
}

// Money moved for exactly the transactions whose status says it did
async function statusMatchesEntries() {
    const moved = [ "COMPLETED", "REVERSED" ]
    const transactions = await transactionModel.aggregate([
        { $lookup: { from: LEDGERS, localField: "_id", foreignField: "transaction", as: "entries", pipeline: [ { $project: { _id: 1 } } ] } },
        { $project: { status: 1, entryCount: { $size: "$entries" } } }
    ])

    return result({
        id: "status-matches-entries",
        title: "Statuses match the ledger",
        description: "Completed and reversed transfers have ledger entries; transfers awaiting approval, rejected or failed have none.",
        checked: transactions.length,
        failures: ids(transactions.filter((t) => moved.includes(t.status) !== (t.entryCount > 0)))
    })
}

// A reversed transfer has exactly one reversal, which undoes it exactly
async function reversalsAreConsistent() {
    const reversed = await transactionModel.aggregate([
        { $match: { status: "REVERSED" } },
        { $lookup: { from: TRANSACTIONS, localField: "_id", foreignField: "reversalOf", as: "reversals" } },
        { $project: { reversalCount: { $size: "$reversals" } } }
    ])

    const reversals = await transactionModel.aggregate([
        { $match: { reversalOf: { $exists: true } } },
        { $lookup: { from: TRANSACTIONS, localField: "reversalOf", foreignField: "_id", as: "original" } },
        {
            $project: {
                ok: {
                    $let: {
                        vars: { o: { $first: "$original" } },
                        in: {
                            $and: [
                                { $eq: [ "$$o.status", "REVERSED" ] },
                                { $eq: [ "$$o.amount", "$amount" ] },
                                { $eq: [ "$$o.fromAccount", "$toAccount" ] },
                                { $eq: [ "$$o.toAccount", "$fromAccount" ] }
                            ]
                        }
                    }
                }
            }
        }
    ])

    return result({
        id: "reversals-consistent",
        title: "Reversals undo exactly one transfer",
        description: "Every reversed transfer has exactly one reversal, and every reversal moves the same amount back between the same two accounts.",
        checked: reversed.length + reversals.length,
        failures: [ ...ids(reversed.filter((t) => t.reversalCount !== 1)), ...ids(reversals.filter((r) => !r.ok)) ]
    })
}

// Only the system reserve may go below zero
async function noNegativeCustomerBalances() {
    const balances = await ledgerModel.aggregate([
        { $group: { _id: "$account", balance: { $sum: ledgerModel.signedAmount } } },
        { $lookup: { from: ACCOUNTS, localField: "_id", foreignField: "_id", as: "account" } },
        { $lookup: { from: USERS, localField: "account.user", foreignField: "_id", as: "owner" } },
        { $project: { balance: 1, isSystem: { $anyElementTrue: [ { $ifNull: [ "$owner.systemUser", [] ] } ] } } }
    ])

    return result({
        id: "no-negative-balances",
        title: "No customer balance is negative",
        description: "Every customer account's ledger balance is zero or more. Only the system reserve, which funds customers, may go negative.",
        checked: balances.length,
        failures: ids(balances.filter((b) => !b.isSystem && b.balance < 0))
    })
}

// Each snapshot equals a fresh sum of the entries it covers
async function snapshotsMatchLedger() {
    const snapshots = await balanceSnapshotModel.aggregate([
        {
            $lookup: {
                from: LEDGERS,
                let: { account: "$account", asOf: "$asOf" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: [ "$account", "$$account" ] },
                                    // Entries without createdAt predate every snapshot
                                    { $lt: [ { $ifNull: [ "$createdAt", new Date(0) ] }, "$$asOf" ] }
                                ]
                            }
                        }
                    },
                    { $group: { _id: null, total: { $sum: ledgerModel.signedAmount } } }
                ],
                as: "actual"
            }
        },
        { $project: { account: 1, matches: { $eq: [ "$balance", { $ifNull: [ { $first: "$actual.total" }, 0 ] } ] } } }
    ])

    return result({
        id: "snapshots-match-ledger",
        title: "Balance snapshots match the ledger",
        description: "Each account's stored balance snapshot equals a fresh sum of the ledger entries it covers.",
        checked: snapshots.length,
        failures: snapshots.filter((s) => !s.matches).map((s) => String(s.account))
    })
}

/**
 * - Run every consistency check over the whole ledger. Read-only.
 */
async function runReconciliation() {
    const checks = await Promise.all([
        trialBalance(),
        entriesMatchTransactions(),
        statusMatchesEntries(),
        reversalsAreConsistent(),
        noNegativeCustomerBalances(),
        snapshotsMatchLedger()
    ])

    const [ latest ] = await balanceSnapshotModel.find().sort({ takenAt: -1 }).limit(1).lean()

    return {
        ranAt: new Date(),
        passed: checks.every((c) => c.passed),
        checks,
        snapshots: {
            accounts: await balanceSnapshotModel.countDocuments(),
            lastTakenAt: latest?.takenAt ?? null,
            asOf: latest?.asOf ?? null
        }
    }
}

module.exports = {
    runReconciliation
}
