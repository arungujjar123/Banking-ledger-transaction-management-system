const path = require("path")
const express = require("express")
const cookieParser = require("cookie-parser")
const mongoose = require("mongoose")
const swaggerUi = require("swagger-ui-express")
const { securityHeaders, docsSecurityHeaders, apiLimiter } = require("./middleware/security.middleware")
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
const apiRouters = require("./routes")
const openApiSpec = require("./docs/openapi")

/**
 * - Use Routes
 */

app.get("/health", (req, res) => {
    res.send("Ledger Service is up and running")
})

app.use("/api", apiLimiter)
for (const [ mountPath, router ] of Object.entries(apiRouters)) {
    app.use(`/api${mountPath}`, router)
}

/**
 * - API docs: Swagger UI at /api/docs, the raw OpenAPI spec at /api/docs/openapi.json
 */
app.get("/api/docs/openapi.json", (req, res) => {
    res.json(openApiSpec)
})
app.use("/api/docs", docsSecurityHeaders, swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customSiteTitle: "LedgerX API docs",
    swaggerOptions: {
        // Requests from "Try it out" carry the session cookie, so signing in here is enough
        withCredentials: true,
        // Do not send the spec to the public online validator
        validatorUrl: null
    }
}))

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