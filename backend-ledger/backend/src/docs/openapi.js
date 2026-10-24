/**
 * - OpenAPI 3.0 description of every /api endpoint, served at /api/docs
 * - tests/docs.test.js fails if a route exists in Express but not here (or the other way
 *   round), so keep this file in step with src/routes
 */

const ref = (name) => ({ $ref: `#/components/schemas/${name}` })
const json = (schema, example) => ({ content: { "application/json": { schema, ...(example !== undefined && { example }) } } })
const ok = (description, schema, example) => ({ description, ...json(schema, example) })
const response = (name) => ({ $ref: `#/components/responses/${name}` })
const body = (schema, example) => ({ required: true, ...json(schema, example) })
const pathId = (name, description) => ({ name, in: "path", required: true, description, schema: ref("ObjectId") })
const object = (properties, required = Object.keys(properties)) => ({ type: "object", required, properties })
const listOf = (key, schema) => object({ [ key ]: { type: "array", items: schema } })

const PUBLIC = []
const ACCOUNT_ID = pathId("accountId", "Account ID")
const TRANSACTION_ID = pathId("transactionId", "Transaction ID")

const EXAMPLE_ID = "6adb0b980b905bafd35e2ca1"
const EXAMPLE_OTHER_ID = "6adb0b980b905bafd35e2ca2"
const EXAMPLE_KEY = "3f1c2a9e-7b1d-4c55-9e0a-2a4f6d8b1c33"

const transferResult = (description, message, status) =>
    ok(description, ref("TransactionResponse"), {
        message,
        transaction: { _id: "6adb0b980b905bafd35e2cb0", fromAccount: EXAMPLE_ID, toAccount: EXAMPLE_OTHER_ID, amount: 150050, status, idempotencyKey: EXAMPLE_KEY }
    })

const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "LedgerX banking ledger API",
        version: "1.0.0",
        description: [
            "Double-entry banking ledger: every transfer writes one DEBIT and one CREDIT entry, balances are derived from the immutable ledger, and transfers are atomic MongoDB transactions.",
            "",
            "**Amounts are integers in paise** (₹1 = 100): ₹1,500.50 is `150050`. Fractions, strings and non-positive values are rejected with `400`.",
            "",
            "**Authentication**: `POST /auth/login` (or `/auth/demo-login`) sets an `httpOnly` session cookie that the browser sends by itself, so \"Try it out\" works right after signing in here. API clients can instead send the returned `token` as `Authorization: Bearer <token>`.",
            "",
            "**Idempotency**: transfers take an `idempotencyKey` (any unique string, e.g. a UUID). Retrying with the same key returns the original transaction (`200`) instead of moving money twice; reusing it for a different transfer returns `409`.",
            "",
            "**Rate limits**: 10 failed logins per account and 30 sign-in requests per IP per 15 minutes; 300 API requests per IP per minute. Blocked requests get `429` with `Retry-After`."
        ].join("\n")
    },
    servers: [ { url: "/api" } ],
    tags: [
        { name: "Auth", description: "Sessions" },
        { name: "Accounts", description: "The signed-in user's accounts, balances and ledger" },
        { name: "Transactions", description: "Transfers, limits and approval requests" },
        { name: "Admin", description: "Users, global ledger and audit (system users only)" },
        { name: "Admin: approvals", description: "Maker-checker queue for transfers above the approval threshold" },
        { name: "Admin: reversals", description: "Undo a completed transfer with a new, opposite one" },
        { name: "Admin: reconciliation", description: "Ledger consistency checks and balance snapshots" }
    ],
    security: [ { cookieAuth: [] }, { bearerAuth: [] } ],
    paths: {
        "/auth/register": {
            post: {
                tags: [ "Auth" ],
                summary: "Create a user and a pending account",
                description: "The new account stays `PENDING` until an admin approves it. Signs the user in.",
                security: PUBLIC,
                requestBody: body(ref("RegisterRequest"), { name: "Neha Gupta", email: "neha@example.com", password: "secret123" }),
                responses: {
                    201: ok("Registered and signed in", ref("AuthResponse")),
                    400: response("BadRequest"),
                    422: ok("The email is already registered", ref("Error"), { message: "User already exists with email.", status: "failed" }),
                    429: response("TooManyRequests")
                }
            }
        },
        "/auth/login": {
            post: {
                tags: [ "Auth" ],
                summary: "Sign in",
                description: "Sets the session cookie and also returns the JWT for API clients.",
                security: PUBLIC,
                requestBody: body(ref("LoginRequest"), { email: "neha@example.com", password: "secret123" }),
                responses: {
                    200: ok("Signed in", ref("AuthResponse")),
                    400: response("BadRequest"),
                    401: ok("Wrong email or password", ref("Error"), { message: "Email or password is INVALID" }),
                    429: response("TooManyRequests")
                }
            }
        },
        "/auth/demo-login": {
            post: {
                tags: [ "Auth" ],
                summary: "Sign in as the demo user",
                description: "Never returns an admin session, even if misconfigured.",
                security: PUBLIC,
                responses: {
                    200: ok("Signed in as the demo user", ref("AuthResponse")),
                    404: ok("No demo user is configured", ref("Error"), { message: "Demo account is not available" }),
                    429: response("TooManyRequests")
                }
            }
        },
        "/auth/me": {
            get: {
                tags: [ "Auth" ],
                summary: "The signed-in user",
                responses: {
                    200: ok("The current user", object({ user: ref("User") })),
                    401: response("Unauthorized")
                }
            }
        },
        "/auth/logout": {
            post: {
                tags: [ "Auth" ],
                summary: "Sign out",
                description: "Revokes the token until it expires and clears the cookie. Always succeeds.",
                security: PUBLIC,
                responses: {
                    200: ok("Signed out", ref("Message"), { message: "User logged out successfully" })
                }
            }
        },

        "/accounts": {
            get: {
                tags: [ "Accounts" ],
                summary: "The user's accounts",
                responses: {
                    200: ok("Accounts", listOf("accounts", ref("Account"))),
                    401: response("Unauthorized")
                }
            },
            post: {
                tags: [ "Accounts" ],
                summary: "Open another account",
                description: "New accounts start `PENDING` until an admin approves them.",
                responses: {
                    201: ok("Account created", object({ account: ref("Account") })),
                    401: response("Unauthorized")
                }
            }
        },
        "/accounts/balance/{accountId}": {
            get: {
                tags: [ "Accounts" ],
                summary: "Balance of one of the user's accounts",
                description: "Derived from the ledger: the latest balance snapshot plus every entry written after it.",
                parameters: [ ACCOUNT_ID ],
                responses: {
                    200: ok("Balance in paise", object({ accountId: ref("ObjectId"), balance: { type: "integer", example: 4500000 } })),
                    401: response("Unauthorized"),
                    404: response("NotFound")
                }
            }
        },
        "/accounts/ledger": {
            get: {
                tags: [ "Accounts" ],
                summary: "The user's ledger entries, newest first",
                responses: {
                    200: ok("Ledger entries", listOf("entries", ref("UserLedgerEntry"))),
                    401: response("Unauthorized")
                }
            }
        },
        "/accounts/lookup/{accountId}": {
            get: {
                tags: [ "Accounts" ],
                summary: "Confirm a transfer recipient",
                description: "Returns only a masked owner name and the account status.",
                parameters: [ ACCOUNT_ID ],
                responses: {
                    200: ok("The recipient", ref("AccountLookup"), { accountId: EXAMPLE_OTHER_ID, ownerName: "Rahul S.", status: "ACTIVE", isOwnAccount: false }),
                    400: response("BadRequest"),
                    401: response("Unauthorized"),
                    404: response("NotFound")
                }
            }
        },

        "/transactions": {
            post: {
                tags: [ "Transactions" ],
                summary: "Transfer money",
                description: [
                    "Moves money from one of the user's accounts as one atomic double-entry transfer.",
                    "",
                    "- At most ₹1,00,000 per transfer and ₹1,00,000 per account per day (IST).",
                    "- Above ₹25,000 the transfer is recorded as `AWAITING_APPROVAL` (`202`) and moves money only when an admin approves it."
                ].join("\n"),
                requestBody: body(ref("TransferRequest"), { fromAccount: EXAMPLE_ID, toAccount: EXAMPLE_OTHER_ID, amount: 150050, idempotencyKey: EXAMPLE_KEY }),
                responses: {
                    201: transferResult("Completed", "Transaction completed successfully", "COMPLETED"),
                    200: transferResult("The idempotency key was already used for this transfer; the original is returned", "Transaction already processed", "COMPLETED"),
                    202: transferResult("Above the approval threshold: recorded, no money moved yet", "Transfer sent for admin approval", "AWAITING_APPROVAL"),
                    400: ok("Invalid input, insufficient balance, an inactive account or over a limit", ref("Error"), { message: "Insufficient balance. Available balance is ₹1,000.00" }),
                    401: response("Unauthorized"),
                    403: ok("The sending account belongs to someone else", ref("Error"), { message: "You can only transfer from your own account" }),
                    404: response("NotFound"),
                    409: ok("The idempotency key was already used for a different transfer", ref("Error"))
                }
            }
        },
        "/transactions/limits/{accountId}": {
            get: {
                tags: [ "Transactions" ],
                summary: "Transfer limits and what the account can still send today",
                parameters: [ ACCOUNT_ID ],
                responses: {
                    200: ok("Limits in paise", ref("Limits"), { maxTransfer: 10000000, dailyLimit: 10000000, approvalThreshold: 2500000, sentToday: 500000, remainingToday: 9500000 }),
                    400: response("BadRequest"),
                    401: response("Unauthorized"),
                    404: response("NotFound")
                }
            }
        },
        "/transactions/approvals": {
            get: {
                tags: [ "Transactions" ],
                summary: "The user's transfers awaiting approval, or rejected in the last 30 days",
                responses: {
                    200: ok("Approval requests, newest first", listOf("transactions", ref("Transaction"))),
                    401: response("Unauthorized")
                }
            }
        },
        "/transactions/system/initial-funds": {
            post: {
                tags: [ "Admin" ],
                summary: "Fund an account from the system reserve",
                description: "The reserve may go negative: it is the source of all money in the system. Not subject to transfer limits.",
                requestBody: body(ref("FundingRequest"), { toAccount: EXAMPLE_ID, amount: 5000000, idempotencyKey: EXAMPLE_KEY }),
                responses: {
                    201: transferResult("Funded", "Transaction completed successfully", "COMPLETED"),
                    200: transferResult("The idempotency key was already used; the original is returned", "Transaction already processed", "COMPLETED"),
                    400: response("BadRequest"),
                    401: response("Unauthorized"),
                    403: response("Forbidden"),
                    404: response("NotFound"),
                    409: ok("The idempotency key was already used for a different transfer", ref("Error"))
                }
            }
        },

        "/admin/users": {
            get: {
                tags: [ "Admin" ],
                summary: "All users with their account status",
                responses: {
                    200: ok("Users", listOf("users", ref("AdminUser"))),
                    401: response("Unauthorized"),
                    403: response("Forbidden")
                }
            }
        },
        "/admin/users/{userId}/status": {
            patch: {
                tags: [ "Admin" ],
                summary: "Approve, freeze, unfreeze or close a user's accounts",
                parameters: [ pathId("userId", "User ID") ],
                requestBody: body(object({ status: ref("AccountStatus") }), { status: "ACTIVE" }),
                responses: {
                    200: ok("Updated", object({ message: { type: "string" }, status: ref("AccountStatus") }), { message: "User status updated to ACTIVE", status: "ACTIVE" }),
                    400: response("BadRequest"),
                    401: response("Unauthorized"),
                    403: response("Forbidden")
                }
            }
        },
        "/admin/ledger": {
            get: {
                tags: [ "Admin" ],
                summary: "Every ledger entry, newest first",
                responses: {
                    200: ok("Ledger entries", listOf("entries", ref("LedgerEntry"))),
                    401: response("Unauthorized"),
                    403: response("Forbidden")
                }
            }
        },
        "/admin/transactions": {
            get: {
                tags: [ "Admin" ],
                summary: "Every transaction, newest first",
                responses: {
                    200: ok("Transactions", listOf("transactions", ref("Transaction"))),
                    401: response("Unauthorized"),
                    403: response("Forbidden")
                }
            }
        },
        "/admin/blocked-tokens": {
            get: {
                tags: [ "Admin" ],
                summary: "Revoked sessions",
                responses: {
                    200: ok("Revoked tokens, newest first", listOf("tokens", ref("BlockedToken"))),
                    401: response("Unauthorized"),
                    403: response("Forbidden")
                }
            }
        },

        "/admin/approvals": {
            get: {
                tags: [ "Admin: approvals" ],
                summary: "Transfers awaiting approval, oldest first",
                responses: {
                    200: ok("The queue, with the customer who asked", listOf("transactions", ref("PendingApproval"))),
                    401: response("Unauthorized"),
                    403: response("Forbidden")
                }
            }
        },
        "/admin/approvals/{transactionId}/approve": {
            post: {
                tags: [ "Admin: approvals" ],
                summary: "Approve and run a waiting transfer",
                description: "Runs the same lock, balance and account checks as any transfer. If one fails, nothing changes and the transfer keeps waiting.",
                parameters: [ TRANSACTION_ID ],
                responses: {
                    200: transferResult("Approved; the money has moved", "Transfer approved", "COMPLETED"),
                    400: ok("A check failed (e.g. the sender no longer has the money)", ref("Error"), { message: "Insufficient balance. Available balance is ₹20,000.00" }),
                    401: response("Unauthorized"),
                    403: response("Forbidden"),
                    404: response("NotFound"),
                    409: ok("Already approved or rejected", ref("Error"), { message: "This transfer was already reviewed; it is COMPLETED" })
                }
            }
        },
        "/admin/approvals/{transactionId}/reject": {
            post: {
                tags: [ "Admin: approvals" ],
                summary: "Reject a waiting transfer",
                description: "No money moves. The customer sees the reason.",
                parameters: [ TRANSACTION_ID ],
                requestBody: body(ref("ReasonRequest"), { reason: "Could not verify the recipient" }),
                responses: {
                    200: transferResult("Rejected", "Transfer rejected", "REJECTED"),
                    400: response("BadRequest"),
                    401: response("Unauthorized"),
                    403: response("Forbidden"),
                    404: response("NotFound"),
                    409: ok("Already approved or rejected", ref("Error"))
                }
            }
        },

        "/admin/transactions/{transactionId}/reverse": {
            post: {
                tags: [ "Admin: reversals" ],
                summary: "Reverse a completed transfer",
                description: "Writes a new, opposite transfer linked to the original (`reversalOf`) and marks the original `REVERSED`, atomically and at most once. Fails without changes if the receiver no longer has the money. Works on frozen accounts.",
                parameters: [ TRANSACTION_ID ],
                requestBody: body(object({ reason: { type: "string", minLength: 3, maxLength: 500 }, idempotencyKey: { type: "string", maxLength: 100 } }), { reason: "Sent to the wrong account", idempotencyKey: EXAMPLE_KEY }),
                responses: {
                    201: transferResult("Reversed", "Transaction reversed", "COMPLETED"),
                    200: transferResult("The idempotency key was already used for this reversal; it is returned", "Reversal already processed", "COMPLETED"),
                    400: ok("Invalid input, the receiver can no longer cover it, or the transaction is itself a reversal", ref("Error")),
                    401: response("Unauthorized"),
                    403: response("Forbidden"),
                    404: response("NotFound"),
                    409: ok("Already reversed, or the key was used for another transaction", ref("Error"), { message: "This transaction has already been reversed" })
                }
            }
        },

        "/admin/reconciliation": {
            get: {
                tags: [ "Admin: reconciliation" ],
                summary: "Run every ledger consistency check",
                description: "Read-only. Re-reads the whole ledger; each check reports how many records it checked and up to 10 failing records.",
                responses: {
                    200: ok("The report", ref("ReconciliationReport")),
                    401: response("Unauthorized"),
                    403: response("Forbidden")
                }
            }
        },
        "/admin/snapshots": {
            post: {
                tags: [ "Admin: reconciliation" ],
                summary: "Take balance snapshots now",
                description: "Stores every account's balance from the entries written more than 5 minutes ago. Also runs daily at 00:10 IST.",
                responses: {
                    201: ok("Snapshot taken", ref("SnapshotResult")),
                    401: response("Unauthorized"),
                    403: response("Forbidden")
                }
            }
        }
    },
    components: {
        securitySchemes: {
            cookieAuth: { type: "apiKey", in: "cookie", name: "token", description: "httpOnly session cookie set by /auth/login" },
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "The `token` returned by /auth/login" }
        },
        responses: {
            BadRequest: { description: "Invalid input", ...json(ref("Error"), { message: "amount must be a positive whole number of paise (e.g. 150050 for ₹1,500.50)" }) },
            Unauthorized: { description: "Missing, expired or revoked session", ...json(ref("Error"), { message: "Unauthorized access, token is missing" }) },
            Forbidden: { description: "Admins only", ...json(ref("Error"), { message: "Forbidden access, not a system user" }) },
            NotFound: { description: "Not found", ...json(ref("Error"), { message: "Account not found" }) },
            TooManyRequests: {
                description: "Rate limit reached",
                headers: { "Retry-After": { description: "Seconds until the limit resets", schema: { type: "integer" } } },
                ...json(ref("Error"), { message: "Too many failed login attempts for this account. Please try again in 15 minutes." })
            }
        },
        schemas: {
            ObjectId: { type: "string", pattern: "^[a-f0-9]{24}$", example: EXAMPLE_ID },
            Paise: { type: "integer", minimum: 1, description: "Amount in paise (₹1 = 100)", example: 150050 },
            Error: object({ message: { type: "string" } }, [ "message" ]),
            Message: object({ message: { type: "string" } }),
            AccountStatus: { type: "string", enum: [ "PENDING", "ACTIVE", "FROZEN", "CLOSED" ] },
            TransactionStatus: { type: "string", enum: [ "PENDING", "AWAITING_APPROVAL", "COMPLETED", "REJECTED", "FAILED", "REVERSED" ] },

            RegisterRequest: object({
                name: { type: "string", minLength: 1, maxLength: 100 },
                email: { type: "string", format: "email" },
                password: { type: "string", minLength: 6, maxLength: 72 }
            }),
            LoginRequest: object({ email: { type: "string", format: "email" }, password: { type: "string" } }),
            User: object({
                _id: ref("ObjectId"),
                email: { type: "string", format: "email" },
                name: { type: "string" },
                systemUser: { type: "boolean", description: "Admins are system users" }
            }),
            AuthResponse: object({ user: ref("User"), token: { type: "string", description: "JWT, valid for 3 days" } }),

            Account: object({
                _id: ref("ObjectId"),
                user: ref("ObjectId"),
                status: ref("AccountStatus"),
                currency: { type: "string", example: "INR" },
                createdAt: { type: "string", format: "date-time" }
            }, [ "_id", "user", "status", "currency" ]),
            AccountLookup: object({
                accountId: ref("ObjectId"),
                ownerName: { type: "string", description: "First name and last initial only" },
                status: ref("AccountStatus"),
                isOwnAccount: { type: "boolean" }
            }),
            LedgerEntry: object({
                _id: ref("ObjectId"),
                account: ref("ObjectId"),
                transaction: ref("ObjectId"),
                type: { type: "string", enum: [ "DEBIT", "CREDIT" ] },
                amount: ref("Paise"),
                createdAt: { type: "string", format: "date-time" }
            }, [ "_id", "account", "transaction", "type", "amount" ]),
            UserLedgerEntry: {
                allOf: [
                    ref("LedgerEntry"),
                    {
                        type: "object",
                        properties: {
                            counterpartyAccount: { ...ref("ObjectId"), description: "The other side of the transfer" },
                            reversalOf: { ...ref("ObjectId"), description: "Set when the entry belongs to a reversal" }
                        }
                    }
                ]
            },

            TransferRequest: object({ fromAccount: ref("ObjectId"), toAccount: ref("ObjectId"), amount: ref("Paise"), idempotencyKey: { type: "string", maxLength: 100 } }),
            FundingRequest: object({ toAccount: ref("ObjectId"), amount: ref("Paise"), idempotencyKey: { type: "string", maxLength: 100 } }),
            ReasonRequest: object({ reason: { type: "string", minLength: 3, maxLength: 500 } }),
            Transaction: object({
                _id: ref("ObjectId"),
                fromAccount: ref("ObjectId"),
                toAccount: ref("ObjectId"),
                amount: ref("Paise"),
                status: ref("TransactionStatus"),
                idempotencyKey: { type: "string" },
                reversalOf: { ...ref("ObjectId"), description: "On reversals: the transaction this one undoes" },
                reason: { type: "string", description: "On reversals: why" },
                reversedBy: { ...ref("ObjectId"), description: "On reversals: the admin" },
                requestedBy: { ...ref("ObjectId"), description: "On transfers that needed approval: the customer" },
                reviewedBy: { ...ref("ObjectId"), description: "The admin who approved or rejected it" },
                reviewedAt: { type: "string", format: "date-time" },
                rejectionReason: { type: "string" },
                createdAt: { type: "string", format: "date-time" }
            }, [ "_id", "fromAccount", "toAccount", "amount", "status", "idempotencyKey" ]),
            TransactionResponse: object({ message: { type: "string" }, transaction: ref("Transaction") }),
            PendingApproval: {
                allOf: [
                    ref("Transaction"),
                    { type: "object", properties: { requestedBy: object({ _id: ref("ObjectId"), name: { type: "string" }, email: { type: "string" } }) } }
                ]
            },
            Limits: object({
                maxTransfer: ref("Paise"),
                dailyLimit: ref("Paise"),
                approvalThreshold: ref("Paise"),
                sentToday: { type: "integer", minimum: 0 },
                remainingToday: { type: "integer", minimum: 0 }
            }),

            AdminUser: {
                allOf: [
                    ref("User"),
                    {
                        type: "object",
                        properties: {
                            status: ref("AccountStatus"),
                            accountsCount: { type: "integer" },
                            accounts: { type: "array", items: ref("Account") }
                        }
                    }
                ]
            },
            BlockedToken: object({ _id: ref("ObjectId"), token: { type: "string" }, createdAt: { type: "string", format: "date-time" } }),

            ReconciliationCheck: object({
                id: { type: "string", example: "trial-balance" },
                title: { type: "string", example: "Debits equal credits" },
                description: { type: "string" },
                passed: { type: "boolean" },
                checked: { type: "integer", description: "Records examined" },
                summary: { type: "string", nullable: true },
                failureCount: { type: "integer" },
                failures: { type: "array", maxItems: 10, items: { type: "string" }, description: "Up to 10 failing record IDs" }
            }, [ "id", "title", "description", "passed", "checked", "failureCount", "failures" ]),
            ReconciliationReport: object({
                ranAt: { type: "string", format: "date-time" },
                passed: { type: "boolean" },
                checks: { type: "array", items: ref("ReconciliationCheck") },
                snapshots: object({
                    accounts: { type: "integer" },
                    lastTakenAt: { type: "string", format: "date-time", nullable: true },
                    asOf: { type: "string", format: "date-time", nullable: true }
                })
            }),
            SnapshotResult: object({
                message: { type: "string", example: "Snapshot taken for 3 accounts" },
                accounts: { type: "integer" },
                asOf: { type: "string", format: "date-time" },
                takenAt: { type: "string", format: "date-time" }
            })
        }
    }
}

module.exports = openApiSpec
