// Runs before every test file. Tests need a MongoDB replica set (transactions),
// e.g. the Docker one-liner in the README or the CI service.
process.env.TEST_MONGO_URI = process.env.TEST_MONGO_URI || "mongodb://127.0.0.1:27017/ledger_test?replicaSet=rs0"
process.env.JWT_SECRET = "test-jwt-secret"
delete process.env.DEMO_EMAIL
delete process.env.DEMO_PASSWORD
