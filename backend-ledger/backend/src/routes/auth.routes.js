const express = require("express")
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middleware/auth.middleware")
const { authLimiter, loginFailureLimiter } = require("../middleware/security.middleware")

const router = express.Router()


/* POST /api/auth/register */
router.post("/register", authLimiter, authController.userRegisterController)


/* POST /api/auth/login */
router.post("/login", authLimiter, loginFailureLimiter, authController.userLoginController)

/**
 * - POST /api/auth/logout
 */
router.post("/logout", authController.userLogoutController)

/**
 * - POST /api/auth/demo-login
 */
router.post("/demo-login", authLimiter, authController.demoLoginController)

/**
 * - GET /api/auth/me
 */
router.get("/me", authMiddleware.authMiddleware, authController.getCurrentUserController)



module.exports = router