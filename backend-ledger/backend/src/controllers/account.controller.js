const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");

async function createAccountController(req, res) {
    const user = req.user;

    const account = await accountModel.create({
        user: user._id
    })

    res.status(201).json({
        account 
    })
}

async function getUserAccountsController(req, res) {
    const accounts = await accountModel.find({ user: req.user._id });

    res.status(200).json({
        accounts
    })
}

async function getAccountBalanceController(req, res) {
    const { accountId } = req.params;

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    })

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    const balance = await account.getBalance();

    res.status(200).json({
        accountId: account._id,
        balance: balance
    })
}

async function getUserLedgerController(req, res) {
    try {
        const userAccounts = await accountModel.find({ user: req.user._id });
        const accountIds = userAccounts.map(a => a._id);
        const entries = await ledgerModel.find({ account: { $in: accountIds } })
            .sort({ _id: -1 })
            .populate("transaction", "fromAccount toAccount")
            .lean();

        // Keep `transaction` as an ID and add the other side of the transfer, so the UI
        // can show "Sent to" / "Received from" without changing the existing shape
        const withCounterparty = entries.map((entry) => {
            const txn = entry.transaction;
            return {
                ...entry,
                transaction: txn?._id ?? txn,
                counterpartyAccount: entry.type === "DEBIT" ? txn?.toAccount : txn?.fromAccount
            };
        });

        res.status(200).json({
            entries: withCounterparty
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch user ledger entries", error: err.message });
    }
}

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i

// "Rahul Kumar Sharma" -> "Rahul S."; enough to confirm a recipient without exposing a full name
function maskName(name) {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean)

    if (parts.length === 0) {
        return "Account holder"
    }

    const first = parts[0]
    const last = parts[parts.length - 1]

    return parts.length > 1 ? `${first} ${last[0].toUpperCase()}.` : first
}

/**
 * - GET /api/accounts/lookup/:accountId
 * - Confirm a transfer recipient: masked owner name and account status only
 */
async function lookupAccountController(req, res) {
    const { accountId } = req.params

    if (!OBJECT_ID_PATTERN.test(accountId)) {
        return res.status(400).json({
            message: "Account ID must be 24 characters (0-9, a-f)"
        })
    }

    const account = await accountModel.findById(accountId).populate("user", "name")

    if (!account) {
        return res.status(404).json({
            message: "No account found with this ID"
        })
    }

    res.status(200).json({
        accountId: account._id,
        ownerName: maskName(account.user?.name),
        status: account.status,
        isOwnAccount: Boolean(account.user?._id?.equals(req.user._id))
    })
}

module.exports = {
    lookupAccountController,
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    getUserLedgerController
}