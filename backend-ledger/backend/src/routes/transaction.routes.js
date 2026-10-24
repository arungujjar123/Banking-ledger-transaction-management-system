const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */

transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)


/**
 * - GET /api/transactions/limits/:accountId
 * - Transfer limits and how much of today's limit the account has used
 */
transactionRoutes.get("/limits/:accountId", authMiddleware.authMiddleware, transactionController.getLimitsController)

/**
 * - GET /api/transactions/approvals
 * - The user's transfers waiting for (or rejected at) admin approval
 */
transactionRoutes.get("/approvals", authMiddleware.authMiddleware, transactionController.getMyApprovalRequestsController)

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;