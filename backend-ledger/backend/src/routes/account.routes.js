const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const accountController = require("../controllers/account.controller")

const router = express.Router()

/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected Route
 */
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)

/**
 * - GET /api/accounts/
 * - Get all accounts of the logged-in user
 * - Protected Route
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController)

/**
 * - GET /api/accounts/ledger
 * - Get ledger entries for the logged-in user
 * - Protected Route
 */
router.get("/ledger", authMiddleware.authMiddleware, accountController.getUserLedgerController)

/**
 * - GET /api/accounts/balance/:accountId
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)

/**
 * - GET /api/accounts/lookup/:accountId
 * - Masked owner name + status, used to confirm a transfer recipient
 */
router.get("/lookup/:accountId", authMiddleware.authMiddleware, accountController.lookupAccountController)

module.exports = router