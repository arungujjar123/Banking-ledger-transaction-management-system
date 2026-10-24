/**
 * - Every API router and the path it is mounted at under /api
 * - app.js mounts these, and tests/docs.test.js checks each of their routes is in the
 *   OpenAPI spec, so a new router belongs here rather than directly in app.js
 */
module.exports = {
    "/auth": require("./auth.routes"),
    "/accounts": require("./account.routes"),
    "/transactions": require("./transaction.routes"),
    "/admin": require("./admin.routes")
}
