require("dotenv").config()

const app = require("./src/app")
const connectToDB = require("./src/config/db")
const { ensureAdminUser, ensureDemoUser } = require("./src/services/seed.service")

connectToDB()
    .then(() => ensureAdminUser())
    .then(admin => ensureDemoUser(admin?.adminAccount))
    .catch(err => console.error("Seed failed:", err.message))

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
