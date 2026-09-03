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
        const entries = await ledgerModel.find({ account: { $in: accountIds } }).sort({ _id: -1 }).lean();

        res.status(200).json({
            entries
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch user ledger entries", error: err.message });
    }
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    getUserLedgerController
}