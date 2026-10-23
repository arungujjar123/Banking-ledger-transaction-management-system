const h = require("./helpers")
const accountModel = require("../src/models/account.model")

beforeAll(h.connectTestDb)
afterAll(h.disconnectTestDb)
beforeEach(h.resetDb)
afterEach(() => {
    delete process.env.DEMO_EMAIL
})

describe("register and login", () => {
    test("registering creates a user with one pending account", async () => {
        const res = await h.api().post("/api/auth/register").send({ name: "Neha Gupta", email: "neha@test.local", password: "secret123" })

        expect(res.status).toBe(201)
        expect(res.body.token).toEqual(expect.any(String))
        expect(res.body.user).not.toHaveProperty("password")

        const accounts = await accountModel.find({ user: res.body.user._id })
        expect(accounts.map((a) => a.status)).toEqual([ "PENDING" ])
    })

    test("rejects a duplicate email", async () => {
        await h.createUser({ email: "taken@test.local" })
        const res = await h.api().post("/api/auth/register").send({ name: "X", email: "taken@test.local", password: "secret123" })
        expect(res.status).toBe(422)
    })

    test("rejects a wrong password", async () => {
        await h.createUser({ email: "neha@test.local" })
        const res = await h.api().post("/api/auth/login").send({ email: "neha@test.local", password: "wrong-password" })
        expect(res.status).toBe(401)
    })

    test("logs in with the right password", async () => {
        await h.createUser({ email: "neha@test.local" })
        const res = await h.api().post("/api/auth/login").send({ email: "neha@test.local", password: "secret123" })

        expect(res.status).toBe(200)
        expect(res.body.user.systemUser).toBe(false)
    })
})

describe("sessions", () => {
    test("GET /auth/me returns the current user", async () => {
        const user = await h.createUser({ name: "Neha Gupta" })
        const res = await h.api().get("/api/auth/me").set("Authorization", `Bearer ${user.token}`)

        expect(res.status).toBe(200)
        expect(res.body.user.name).toBe("Neha Gupta")
    })

    test("a token stops working after logout", async () => {
        const user = await h.createUser()
        const auth = [ "Authorization", `Bearer ${user.token}` ]

        expect((await h.api().post("/api/auth/logout").set(...auth)).status).toBe(200)
        expect((await h.api().get("/api/accounts").set(...auth)).status).toBe(401)
    })

    test("rejects a token whose user no longer exists", async () => {
        const token = h.tokenFor({ _id: "6adb0b980b905bafd35e2c99" })
        const res = await h.api().get("/api/accounts").set("Authorization", `Bearer ${token}`)
        expect(res.status).toBe(401)
    })
})

describe("demo login", () => {
    test("returns 404 when no demo user is configured", async () => {
        expect((await h.api().post("/api/auth/demo-login")).status).toBe(404)
    })

    test("signs in as the configured demo user", async () => {
        const demo = await h.createUser({ name: "Demo User", email: "demo@test.local" })
        process.env.DEMO_EMAIL = "demo@test.local"

        const res = await h.api().post("/api/auth/demo-login")

        expect(res.status).toBe(200)
        expect(res.body.user._id).toBe(demo.user._id.toString())
    })

    test("never hands out an admin session, even if DEMO_EMAIL points at the admin", async () => {
        const admin = await h.createAdmin()
        process.env.DEMO_EMAIL = admin.user.email

        expect((await h.api().post("/api/auth/demo-login")).status).toBe(404)
    })
})
