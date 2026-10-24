const SwaggerParser = require("@apidevtools/swagger-parser")
const h = require("./helpers")
const openApiSpec = require("../src/docs/openapi")
const apiRouters = require("../src/routes")

// "METHOD /path/{param}" for every route Express serves under /api
const expressRoutes = () =>
    Object.entries(apiRouters).flatMap(([ mountPath, router ]) =>
        router.stack
            .filter((layer) => layer.route)
            .flatMap((layer) =>
                Object.keys(layer.route.methods).map((method) => {
                    const path = `${mountPath}${layer.route.path === "/" ? "" : layer.route.path}`
                    return `${method.toUpperCase()} ${path.replace(/:(\w+)/g, "{$1}")}`
                })
            )
    )

const documentedRoutes = () =>
    Object.entries(openApiSpec.paths).flatMap(([ path, operations ]) =>
        Object.keys(operations).map((method) => `${method.toUpperCase()} ${path}`)
    )

describe("OpenAPI docs", () => {
    test("the spec is valid OpenAPI", async () => {
        // validate() dereferences in place, so give it a copy
        await expect(SwaggerParser.validate(structuredClone(openApiSpec))).resolves.toBeDefined()
    })

    test("documents exactly the routes Express serves", () => {
        expect(documentedRoutes().sort()).toEqual(expressRoutes().sort())
        expect(expressRoutes().length).toBeGreaterThanOrEqual(24)
    })

    test("every operation has a summary and a success response", () => {
        const incomplete = Object.entries(openApiSpec.paths).flatMap(([ path, operations ]) =>
            Object.entries(operations)
                .filter(([ , op ]) => !op.summary || !Object.keys(op.responses).some((status) => status.startsWith("2")))
                .map(([ method ]) => `${method.toUpperCase()} ${path}`)
        )

        expect(incomplete).toEqual([])
    })

    test("Swagger UI and the raw spec are served", async () => {
        const page = await h.api().get("/api/docs/")
        expect(page.status).toBe(200)
        expect(page.text).toMatch(/swagger-ui/)

        const spec = await h.api().get("/api/docs/openapi.json")
        expect(spec.status).toBe(200)
        expect(spec.body.info.title).toBe("LedgerX banking ledger API")
    })

    test("only the docs page allows inline styles; the app keeps its strict policy", async () => {
        const docs = await h.api().get("/api/docs/")
        expect(docs.headers[ "content-security-policy" ]).toMatch(/style-src 'self' 'unsafe-inline'/)
        expect(docs.headers[ "content-security-policy" ]).toMatch(/script-src 'self'(;|$)/)

        const app = await h.api().get("/health")
        expect(app.headers[ "content-security-policy" ]).not.toMatch(/unsafe-inline/)
    })
})
