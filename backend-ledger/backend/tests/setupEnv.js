// Runs before every test file. Tests need a MongoDB replica set (transactions),
// e.g. the Docker one-liner in the README or the CI service.
process.env.TEST_MONGO_URI = process.env.TEST_MONGO_URI || "mongodb://127.0.0.1:27017/ledger_test?replicaSet=rs0"
process.env.JWT_SECRET = "test-jwt-secret"
delete process.env.DEMO_EMAIL
delete process.env.DEMO_PASSWORD
// Most suites move large sums and test other things; limits.test.js sets the limits it checks
process.env.MAX_TRANSFER_RUPEES = "10000000"
process.env.DAILY_TRANSFER_LIMIT_RUPEES = "10000000"
process.env.APPROVAL_THRESHOLD_RUPEES = "10000000"
