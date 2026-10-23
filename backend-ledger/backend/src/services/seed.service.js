const userModel = require("../models/user.model")
const accountModel = require("../models/account.model")

/**
 * - Create the system admin user and its ACTIVE system account if missing
 * - Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD env variables
 * - Safe to run on every startup (idempotent)
 */
async function ensureAdminUser() {
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD

    if (!email || !password) {
        console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed")
        return null
    }

    let adminUser = await userModel.findOne({ email }).select("+systemUser")

    if (!adminUser) {
        adminUser = await userModel.create({
            name: "System Admin",
            email,
            password,
            systemUser: true
        })
        console.log("Admin user created:", email)
    }

    let adminAccount = await accountModel.findOne({ user: adminUser._id })

    if (!adminAccount) {
        adminAccount = await accountModel.create({
            user: adminUser._id,
            status: "ACTIVE",
            currency: "INR"
        })
        console.log("Admin system account created:", adminAccount._id.toString())
    }

    return { adminUser, adminAccount }
}

module.exports = {
    ensureAdminUser
}
