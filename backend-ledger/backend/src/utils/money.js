// All amounts are stored and exchanged as integer paise (₹1,500.50 -> 150050), so ledger sums
// are exact. Floating-point rupees would accumulate rounding errors (0.1 + 0.2 !== 0.3).

const isValidPaise = (value) => Number.isSafeInteger(value) && value > 0

// 150050 -> "₹1,500.50" (for messages and emails only; never stored)
const formatRupees = (paise) =>
    "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

module.exports = {
    isValidPaise,
    formatRupees
}
