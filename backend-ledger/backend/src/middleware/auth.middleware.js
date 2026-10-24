const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const tokenBlackListModel = require("../models/blackList.model")

// The browser sends the httpOnly cookie; API clients may send an Authorization: Bearer header
const getRequestToken = (req) => req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

/**
 * - Resolve the user behind the request's token, or the error to send back
 */
async function authenticate(req, { systemUser = false } = {}) {
    const token = getRequestToken(req)

    if (typeof token !== "string" || !token) {
        return { status: 401, message: "Unauthorized access, token is missing" }
    }

    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
        return { status: 401, message: "Unauthorized access, token is invalid" }
    }

    if (await tokenBlackListModel.exists({ token })) {
        return { status: 401, message: "Unauthorized access, token is invalid" }
    }

    const user = await userModel.findById(decoded.userId).select(systemUser ? "+systemUser" : "")

    if (!user) {
        return { status: 401, message: "Unauthorized access, user not found" }
    }

    if (systemUser && !user.systemUser) {
        return { status: 403, message: "Forbidden access, not a system user" }
    }

    return { user }
}

const requireAuth = (options) => async (req, res, next) => {
    const { user, status, message } = await authenticate(req, options)

    if (!user) {
        return res.status(status).json({ message })
    }

    req.user = user
    return next()
}

module.exports = {
    getRequestToken,
    authMiddleware: requireAuth(),
    authSystemUserMiddleware: requireAuth({ systemUser: true })
}
