const helmet = require("helmet")
const { rateLimit } = require("express-rate-limit")

/**
 * - Security headers. The frontend is served from this same origin, so scripts, styles and
 *   API calls are limited to 'self'; Google Fonts is the only outside source.
 * - No 'unsafe-inline' scripts: an injected <script> tag cannot run.
 */
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            "script-src": [ "'self'" ],
            "style-src": [ "'self'", "https://fonts.googleapis.com" ],
            "font-src": [ "'self'", "https://fonts.gstatic.com" ],
            "img-src": [ "'self'", "data:" ],
            "connect-src": [ "'self'" ],
            "frame-ancestors": [ "'none'" ],
            // HSTS already moves browsers to HTTPS; this directive would also break plain-http localhost
            "upgrade-insecure-requests": null
        }
    }
})

const createLimiter = ({ windowMinutes, limit, message, ...options }) => rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res, next, config) => {
        // The forwarded-for chain shows whether TRUST_PROXY_HOPS picks the real client address
        console.warn(`Rate limit reached: ${req.method} ${req.originalUrl} ip=${req.ip} forwarded-for=${req.headers[ "x-forwarded-for" ] || "-"}`)
        res.status(config.statusCode).json({ message })
    },
    ...options
})

// Every API call, per client IP
const apiLimiter = createLimiter({
    windowMinutes: 1,
    limit: 300,
    message: "Too many requests. Please slow down and try again in a minute."
})

// Login, register and demo login, per client IP: caps password spraying across many accounts
const authLimiter = createLimiter({
    windowMinutes: 15,
    limit: 30,
    message: "Too many sign-in attempts from this network. Please try again in 15 minutes."
})

// Failed logins per email address, wherever they come from: caps password guessing on one account.
// Successful logins are not counted.
const loginFailureLimiter = createLimiter({
    windowMinutes: 15,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `login:${String(req.body?.email ?? "").trim().toLowerCase()}`,
    message: "Too many failed login attempts for this account. Please try again in 15 minutes."
})

module.exports = {
    securityHeaders,
    apiLimiter,
    authLimiter,
    loginFailureLimiter
}
