const h = require("./helpers")
const tokenBlackListModel = require("../src/models/blackList.model")

beforeAll(h.connectTestDb)
afterAll(h.disconnectTestDb)
beforeEach(h.resetDb)

const login = (body) => h.api().post("/api/auth/login").send(body)

describe("injection and malformed input", () => {
    test.each([
        [ "an operator as the email", { email: { $regex: "^a" }, password: "secret123" } ],
        [ "an operator as the password", { email: "neha@test.local", password: { $ne: null } } ],
        [ "a missing password", { email: "neha@test.local" } ]
    ])("login rejects %s with 400", async (_, body) => {
        await h.createUser({ email: "neha@test.local" })

        const res = await login(body)

        expect(res.status).toBe(400)
        expect(res.body.token).toBeUndefined()
    })

    test("register rejects an operator as the email", async () => {
        const res = await h.api().post("/api/auth/register").send({ name: "X", email: { $gt: "" }, password: "secret123" })
        expect(res.status).toBe(400)
    })

    test.each([
        [ "a malformed email", { name: "Neha", email: "not-an-email", password: "secret123" } ],
        [ "a short password", { name: "Neha", email: "neha@test.local", password: "123" } ],
        [ "a blank name", { name: "   ", email: "neha@test.local", password: "secret123" } ]
    ])("register rejects %s with 400", async (_, body) => {
        expect((await h.api().post("/api/auth/register").send(body)).status).toBe(400)
    })

    test("login ignores email case and surrounding spaces", async () => {
        await h.createUser({ email: "neha@test.local" })
        expect((await login({ email: "  Neha@Test.Local ", password: "secret123" })).status).toBe(200)
    })

    test("invalid JSON gets a JSON 400, not an HTML error page", async () => {
        const res = await h.api().post("/api/auth/login").set("Content-Type", "application/json").send("{ not json")

        expect(res.status).toBe(400)
        expect(res.body).toEqual({ message: "Request body must be valid JSON" })
    })

    test("unknown API routes return JSON 404", async () => {
        const res = await h.api().get("/api/does-not-exist")
        expect(res.status).toBe(404)
        expect(res.body).toEqual({ message: "Not found" })
    })
})

describe("session cookie", () => {
    test("is httpOnly and sameSite strict, and lasts as long as the token", async () => {
        await h.createUser({ email: "neha@test.local" })
        const res = await login({ email: "neha@test.local", password: "secret123" })

        const cookie = res.headers[ "set-cookie" ].find((c) => c.startsWith("token="))
        expect(cookie).toMatch(/HttpOnly/)
        expect(cookie).toMatch(/SameSite=Strict/)
        expect(cookie).toMatch(/Max-Age=259200/)
        expect(cookie).not.toMatch(/Secure/)
    })

    test("is marked secure when the request reached the proxy over HTTPS", async () => {
        await h.createUser({ email: "neha@test.local" })
        const res = await login({ email: "neha@test.local", password: "secret123" }).set("X-Forwarded-Proto", "https")

        expect(res.headers[ "set-cookie" ].find((c) => c.startsWith("token="))).toMatch(/Secure/)
    })

    test("authenticates requests on its own, without an Authorization header", async () => {
        const agent = h.agent()
        await h.createUser({ name: "Neha Gupta", email: "neha@test.local" })

        await agent.post("/api/auth/login").send({ email: "neha@test.local", password: "secret123" })
        const me = await agent.get("/api/auth/me")
        expect(me.body.user.name).toBe("Neha Gupta")

        await agent.post("/api/auth/logout")
        expect((await agent.get("/api/auth/me")).status).toBe(401)
    })

    test("logout does not store tokens this server never issued", async () => {
        const res = await h.api().post("/api/auth/logout").set("Authorization", "Bearer garbage-token")

        expect(res.status).toBe(200)
        expect(await tokenBlackListModel.countDocuments()).toBe(0)
    })
})

describe("security headers", () => {
    test("are set, and the server does not advertise Express", async () => {
        const res = await h.api().get("/health")

        expect(res.headers[ "x-powered-by" ]).toBeUndefined()
        expect(res.headers[ "x-content-type-options" ]).toBe("nosniff")
        expect(res.headers[ "strict-transport-security" ]).toMatch(/max-age=/)
        expect(res.headers[ "content-security-policy" ]).toMatch(/script-src 'self'(;|$)/)
        expect(res.headers[ "content-security-policy" ]).toMatch(/frame-ancestors 'none'/)
    })
})

// Rate limits run last: they share an in-memory counter for this test file's app instance
describe("rate limits", () => {
    test("an account locks after 10 failed logins, even with the right password", async () => {
        await h.createUser({ email: "target@test.local" })

        for (let i = 0; i < 10; i++) {
            expect((await login({ email: "target@test.local", password: `wrong-${i}` })).status).toBe(401)
        }

        const blocked = await login({ email: "TARGET@test.local", password: "secret123" })
        expect(blocked.status).toBe(429)
        expect(blocked.headers[ "retry-after" ]).toEqual(expect.any(String))
        expect(blocked.body.message).toMatch(/Too many failed login attempts/)

        // Other accounts are not affected
        await h.createUser({ email: "other@test.local" })
        expect((await login({ email: "other@test.local", password: "secret123" })).status).toBe(200)
    })

    test("one client IP is limited to 30 sign-in requests per 15 minutes", async () => {
        // A client address of its own (as the proxy reports it), so earlier tests' requests do not count
        const demoLogin = (ip) => h.api().post("/api/auth/demo-login").set("X-Forwarded-For", ip)

        for (let i = 0; i < 30; i++) {
            expect((await demoLogin("203.0.113.7")).status).toBe(404) // no demo user configured
        }

        expect((await demoLogin("203.0.113.7")).status).toBe(429)
        expect((await demoLogin("203.0.113.8")).status).toBe(404)
    })
})
