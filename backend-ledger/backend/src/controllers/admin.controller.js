const userModel = require('../models/user.model');
const accountModel = require('../models/account.model');
const ledgerModel = require('../models/ledger.model');
const transactionModel = require('../models/transaction.model');
const tokenBlackListModel = require('../models/blackList.model');
const { TransferError } = require('../services/transfer.service');
const { reverseTransaction } = require('../services/reversal.service');
const { approveTransfer, rejectTransfer } = require('../services/approval.service');
const { runReconciliation } = require('../services/reconciliation.service');
const { takeBalanceSnapshots } = require('../services/snapshot.service');

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

/**
 * - GET /api/admin/users
 * - Fetch all registered users with their account status and counts
 */
async function getAllUsersController(req, res) {
    try {
        const users = await userModel.find().select("+systemUser").lean();
        
        const usersWithAccounts = await Promise.all(
            users.map(async (u) => {
                const accounts = await accountModel.find({ user: u._id });
                const currentStatus = accounts.length > 0 ? accounts[0].status : 'PENDING';
                return {
                    ...u,
                    status: currentStatus,
                    accountsCount: accounts.length,
                    accounts: accounts
                };
            })
        );

        res.status(200).json({
            users: usersWithAccounts
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch users", error: err.message });
    }
}

/**
 * - GET /api/admin/ledger
 * - Fetch all ledger entries across all accounts in system
 */
async function getAllLedgerEntriesController(req, res) {
    try {
        const entries = await ledgerModel.find().sort({ _id: -1 }).lean();
        res.status(200).json({
            entries
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch ledger entries", error: err.message });
    }
}

/**
 * - GET /api/admin/transactions
 * - Fetch all system transactions
 */
async function getAllTransactionsController(req, res) {
    try {
        const transactions = await transactionModel.find().sort({ createdAt: -1 }).lean();
        res.status(200).json({
            transactions
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch transactions", error: err.message });
    }
}

/**
 * - GET /api/admin/blocked-tokens
 * - Fetch all blacklisted JWT tokens
 */
async function getBlockedTokensController(req, res) {
    try {
        const tokens = await tokenBlackListModel.find().sort({ createdAt: -1 }).lean();
        res.status(200).json({
            tokens
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch blocked tokens", error: err.message });
    }
}

/**
 * - PATCH /api/admin/users/:userId/status
 * - Update account status for user's accounts (PENDING, ACTIVE, FROZEN, CLOSED)
 */
async function updateUserStatusController(req, res) {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        if (![ "PENDING", "ACTIVE", "FROZEN", "CLOSED" ].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const accounts = await accountModel.find({ user: userId });

        if (accounts.length === 0) {
            // If user has no account yet, create one with the target status
            await accountModel.create({
                user: userId,
                status: status
            });
        } else {
            await accountModel.updateMany({ user: userId }, { status });
        }

        res.status(200).json({
            message: `User status updated to ${status}`,
            status
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to update account status", error: err.message });
    }
}

/**
 * - POST /api/admin/transactions/:transactionId/reverse
 * - Undo a completed transfer with a new, opposite transfer (see services/reversal.service.js)
 * - Body: { reason, idempotencyKey }
 */
async function reverseTransactionController(req, res) {
    const { transactionId } = req.params;
    const { reason, idempotencyKey } = req.body;

    if (!OBJECT_ID_PATTERN.test(transactionId)) {
        return res.status(400).json({ message: "Transaction IDs are 24 characters (0-9, a-f)" });
    }
    if (typeof reason !== "string" || reason.trim().length < 3 || reason.trim().length > 500) {
        return res.status(400).json({ message: "A reason between 3 and 500 characters is required" });
    }
    if (typeof idempotencyKey !== "string" || !idempotencyKey || idempotencyKey.length > 100) {
        return res.status(400).json({ message: "idempotencyKey is required (at most 100 characters)" });
    }

    try {
        const result = await reverseTransaction({
            transactionId,
            reason: reason.trim(),
            idempotencyKey,
            adminId: req.user._id
        });

        return res.status(result.replayed ? 200 : 201).json({
            message: result.replayed ? "Reversal already processed" : "Transaction reversed",
            transaction: result.transaction
        });
    } catch (err) {
        if (err instanceof TransferError) {
            return res.status(err.status).json({ message: err.message });
        }
        console.error("Reversal failed:", err);
        return res.status(500).json({ message: "Reversal failed. No money was moved, please try again." });
    }
}

// Shared answer for review endpoints: business errors keep their status, anything else is a 500
function sendReviewError(res, err, action) {
    if (err instanceof TransferError) {
        return res.status(err.status).json({ message: err.message });
    }
    console.error(`${action} failed:`, err);
    return res.status(500).json({ message: `${action} failed. Nothing was changed, please try again.` });
}

/**
 * - GET /api/admin/approvals
 * - Transfers waiting for approval, oldest first, with who asked for them
 */
async function getPendingApprovalsController(req, res) {
    const transactions = await transactionModel.find({ status: "AWAITING_APPROVAL" })
        .sort({ createdAt: 1 })
        .populate("requestedBy", "name email")
        .lean();

    res.status(200).json({ transactions });
}

/**
 * - POST /api/admin/approvals/:transactionId/approve
 * - Execute a transfer that is waiting for approval (see services/approval.service.js)
 */
async function approveTransferController(req, res) {
    const { transactionId } = req.params;
    if (!OBJECT_ID_PATTERN.test(transactionId)) {
        return res.status(400).json({ message: "Transaction IDs are 24 characters (0-9, a-f)" });
    }

    try {
        const transaction = await approveTransfer({ transactionId, adminId: req.user._id });
        return res.status(200).json({ message: "Transfer approved", transaction });
    } catch (err) {
        return sendReviewError(res, err, "Approval");
    }
}

/**
 * - POST /api/admin/approvals/:transactionId/reject
 * - Body: { reason }
 */
async function rejectTransferController(req, res) {
    const { transactionId } = req.params;
    const { reason } = req.body;

    if (!OBJECT_ID_PATTERN.test(transactionId)) {
        return res.status(400).json({ message: "Transaction IDs are 24 characters (0-9, a-f)" });
    }
    if (typeof reason !== "string" || reason.trim().length < 3 || reason.trim().length > 500) {
        return res.status(400).json({ message: "A reason between 3 and 500 characters is required" });
    }

    try {
        const transaction = await rejectTransfer({ transactionId, adminId: req.user._id, reason: reason.trim() });
        return res.status(200).json({ message: "Transfer rejected", transaction });
    } catch (err) {
        return sendReviewError(res, err, "Rejection");
    }
}

/**
 * - GET /api/admin/reconciliation
 * - Run every ledger consistency check (read-only) and report each one
 */
async function getReconciliationController(req, res) {
    res.status(200).json(await runReconciliation());
}

/**
 * - POST /api/admin/snapshots
 * - Store every account's balance now (the server also does this daily at 00:10 IST)
 */
async function takeSnapshotsController(req, res) {
    const result = await takeBalanceSnapshots();
    res.status(201).json({ message: `Snapshot taken for ${result.accounts} accounts`, ...result });
}

module.exports = {
    getReconciliationController,
    takeSnapshotsController,
    getPendingApprovalsController,
    approveTransferController,
    rejectTransferController,
    reverseTransactionController,
    getAllUsersController,
    getAllLedgerEntriesController,
    getAllTransactionsController,
    getBlockedTokensController,
    updateUserStatusController
};
