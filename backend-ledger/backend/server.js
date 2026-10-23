require("dotenv").config()

const app = require("./src/app")
const connectToDB = require("./src/config/db")
const { ensureAdminUser } = require("./src/services/seed.service")

connectToDB()
    .then(() => ensureAdminUser())
    .catch(err => console.error("Admin seed failed:", err.message))

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
