const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// GET /api/admin/users
router.get('/users', authMiddleware.authSystemUserMiddleware, adminController.getAllUsersController);

// GET /api/admin/ledger
router.get('/ledger', authMiddleware.authSystemUserMiddleware, adminController.getAllLedgerEntriesController);

// GET /api/admin/transactions
router.get('/transactions', authMiddleware.authSystemUserMiddleware, adminController.getAllTransactionsController);

// GET /api/admin/blocked-tokens
router.get('/blocked-tokens', authMiddleware.authSystemUserMiddleware, adminController.getBlockedTokensController);

/**
 * - POST /api/admin/transactions/:transactionId/reverse
 * - Reverse a completed transfer with a new, opposite transfer
 */
router.post('/transactions/:transactionId/reverse', authMiddleware.authSystemUserMiddleware, adminController.reverseTransactionController);

// PATCH /api/admin/users/:userId/status
router.patch('/users/:userId/status', authMiddleware.authSystemUserMiddleware, adminController.updateUserStatusController);

module.exports = router;
