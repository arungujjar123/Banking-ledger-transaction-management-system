const userModel = require("../models/user.model")
const accountModel = require("../models/account.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")
const tokenBlackListModel = require("../models/blackList.model")

/**
 * - Issue a JWT for the user and send it as cookie + response body
 */
function sendAuthResponse(res, user, statusCode) {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })

    res.cookie("token", token)

    return res.status(statusCode).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            systemUser: user.systemUser || false
        },
        token
    })
}

/**
* - user register controller
* - POST /api/auth/register
*/
async function userRegisterController(req, res) {
    const { email, password, name } = req.body

    const isExists = await userModel.findOne({
        email: email
    })

    if (isExists) {
        return res.status(422).json({
            message: "User already exists with email.",
            status: "failed"
        })
    }

    const user = await userModel.create({
        email, password, name
    })

    // Create a default PENDING account for new user
    await accountModel.create({
        user: user._id,
        status: "PENDING"
    })

    sendAuthResponse(res, user, 201)

    await emailService.sendRegistrationEmail(user.email, user.name)
}

/**
 * - User Login Controller
 * - POST /api/auth/login
  */

async function userLoginController(req, res) {
    const { email, password } = req.body
    
    const user = await userModel.findOne({ email }).select("+password +systemUser")

    if (!user) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        })
    }

    return sendAuthResponse(res, user, 200)
}

/**
 * - Demo Login Controller
 * - POST /api/auth/demo-login
 * - Logs in as the seeded demo user, so the demo password never reaches the client
 */
async function demoLoginController(req, res) {
    const demoEmail = process.env.DEMO_EMAIL

    const user = demoEmail && await userModel.findOne({ email: demoEmail }).select("+systemUser")

    // Never hand out an admin session, even if DEMO_EMAIL is misconfigured
    if (!user || user.systemUser) {
        return res.status(404).json({
            message: "Demo account is not available"
        })
    }

    return sendAuthResponse(res, user, 200)
}

/**
 * - Current User Controller
 * - GET /api/auth/me
 */
async function getCurrentUserController(req, res) {
    const user = await userModel.findById(req.user._id).select("+systemUser")

    return res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            systemUser: user.systemUser || false
        }
    })
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
  */
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        })
    }

    await tokenBlackListModel.create({
        token: token
    })

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController,
    demoLoginController,
    getCurrentUserController
}