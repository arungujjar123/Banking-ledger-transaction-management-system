const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// GET /api/admin/users
router.get('/users', authMiddleware.authMiddleware, adminController.getAllUsersController);

// GET /api/admin/ledger
router.get('/ledger', authMiddleware.authMiddleware, adminController.getAllLedgerEntriesController);

// GET /api/admin/transactions
router.get('/transactions', authMiddleware.authMiddleware, adminController.getAllTransactionsController);

// GET /api/admin/blocked-tokens
router.get('/blocked-tokens', authMiddleware.authMiddleware, adminController.getBlockedTokensController);

// PATCH /api/admin/users/:userId/status
router.patch('/users/:userId/status', authMiddleware.authMiddleware, adminController.updateUserStatusController);

module.exports = router;
