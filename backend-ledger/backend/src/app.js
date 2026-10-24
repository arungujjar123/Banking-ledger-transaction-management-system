const path = require("path")
const express = require("express")
const cookieParser = require("cookie-parser")
const mongoose = require("mongoose")
const { securityHeaders, apiLimiter } = require("./middleware/security.middleware")
const errorHandler = require("./middleware/error.middleware")

// Query filters never treat request data as operators: { "$ne": null } is matched literally
mongoose.set("sanitizeFilter", true)

const app = express()

// Behind Render's proxies: req.ip must be the client's address (for rate limits) and
// req.secure must reflect the original HTTPS request (for the secure cookie flag)
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1))
app.disable("x-powered-by")

app.use(securityHeaders)
app.use(express.json({ limit: "10kb" }))
app.use(cookieParser())

/**
 * - Routes required
 */
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")
const adminRouter = require("./routes/admin.routes")

/**
 * - Use Routes
 */

app.get("/health", (req, res) => {
    res.send("Ledger Service is up and running")
})

app.use("/api", apiLimiter)
app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)
app.use("/api/admin", adminRouter)

/**
 * - Serve frontend build (production)
 */
const frontendDist = path.join(__dirname, "../../frontend/dist")
app.use(express.static(frontendDist))
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"))
})

// Unknown API routes get JSON, not the SPA
app.use("/api", (req, res) => {
    res.status(404).json({ message: "Not found" })
})

app.use(errorHandler)

module.exports = app