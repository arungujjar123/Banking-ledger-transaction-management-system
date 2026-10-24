require("dotenv").config()

const app = require("./src/app")
const connectToDB = require("./src/config/db")
const { migrateAmountsToPaise } = require("./src/migrations/amountsToPaise")
const { ensureAdminUser, ensureDemoUser } = require("./src/services/seed.service")

const PORT = process.env.PORT || 3000

async function start() {
    await connectToDB()

    // Data migrations finish before the server accepts requests, so no transfer can be
    // written in the new format and then converted again
    await migrateAmountsToPaise()

    try {
        const admin = await ensureAdminUser()
        await ensureDemoUser(admin?.adminAccount)
    } catch (err) {
        console.error("Seed failed:", err.message)
    }

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

start().catch((err) => {
    console.error("Startup failed:", err)
    process.exit(1)
})
