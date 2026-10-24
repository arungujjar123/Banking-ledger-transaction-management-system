const userModel = require("../models/user.model")
const accountModel = require("../models/account.model")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const emailService = require("../services/email.service")
const tokenBlackListModel = require("../models/blackList.model")
const { getRequestToken } = require("../middleware/auth.middleware")

const SESSION_DAYS = 3
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Compared against when the email is unknown, so a login takes as long whether or not the
// account exists (response time must not reveal which emails are registered)
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("not-a-real-password", 10)

const isString = (value) => typeof value === "string"

/**
 * - Session cookie: httpOnly (page scripts cannot read it, so an XSS bug cannot steal it),
 *   sameSite strict (other sites cannot make the browser send it, which blocks CSRF), and
 *   secure whenever the request arrived over HTTPS
 */
const sessionCookieOptions = (req) => ({
    httpOnly: true,
    sameSite: "strict",
    secure: req.secure,
    path: "/"
})

/**
 * - Issue a JWT for the user and send it as cookie + response body (the body copy is for
 *   API clients; the web app relies on the cookie alone)
 */
function sendAuthResponse(req, res, user, statusCode) {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` })

    res.cookie("token", token, { ...sessionCookieOptions(req), maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 })

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
    const { password } = req.body
    // Only plain strings get near the database: an object such as { "$ne": null } is rejected
    if (!isString(req.body.name) || !isString(req.body.email) || !isString(password)) {
        return res.status(400).json({ message: "name, email and password are required" })
    }

    const name = req.body.name.trim()
    const email = req.body.email.trim().toLowerCase()

    if (!name || name.length > 100) {
        return res.status(400).json({ message: "Name must be between 1 and 100 characters" })
    }
    if (!EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" })
    }
    // bcrypt only uses the first 72 bytes of a password
    if (password.length < 6 || password.length > 72) {
        return res.status(400).json({ message: "Password must be between 6 and 72 characters" })
    }

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

    sendAuthResponse(req, res, user, 201)

    // The welcome email never delays or fails the registration
    emailService.sendRegistrationEmail(user.email, user.name)
        .catch((err) => console.error("Registration email failed:", err.message))
}

/**
 * - User Login Controller
 * - POST /api/auth/login
  */

async function userLoginController(req, res) {
    const { email, password } = req.body

    if (!isString(email) || !isString(password) || !email.trim() || !password) {
        return res.status(400).json({ message: "Email and password are required" })
    }

    const user = await userModel.findOne({ email: email.trim().toLowerCase() }).select("+password +systemUser")

    const isValidPassword = user
        ? await user.comparePassword(password)
        : await bcrypt.compare(password, DUMMY_PASSWORD_HASH).then(() => false)

    if (!isValidPassword) {
        return res.status(401).json({
            message: "Email or password is INVALID"
        })
    }

    return sendAuthResponse(req, res, user, 200)
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

    return sendAuthResponse(req, res, user, 200)
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

function isValidToken(token) {
    try {
        jwt.verify(token, process.env.JWT_SECRET)
        return true
    } catch {
        return false
    }
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
  */
async function userLogoutController(req, res) {
    const token = getRequestToken(req)

    // Only tokens this server issued (and that have not expired) are worth revoking;
    // anything else is ignored, so the blacklist cannot be filled with junk
    if (isString(token) && isValidToken(token)) {
        try {
            await tokenBlackListModel.create({ token })
        } catch (err) {
            // Already revoked by an earlier logout
            if (err.code !== 11000) throw err
        }
    }

    res.clearCookie("token", sessionCookieOptions(req))

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