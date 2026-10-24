/**
 * - Last error handler: clients get a short JSON message, never a stack trace or file path.
 *   The full error stays in the server logs.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    // Body that is not valid JSON, or too large
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Request body must be valid JSON" })
    }
    if (err.type === "entity.too.large") {
        return res.status(413).json({ message: "Request body is too large" })
    }

    console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err)

    if (res.headersSent) {
        return
    }
    return res.status(500).json({ message: "Something went wrong. Please try again." })
}

module.exports = errorHandler
