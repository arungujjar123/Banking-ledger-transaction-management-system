const amountFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

// The API exchanges amounts as integer paise (₹1,500.50 = 150050) so ledger sums stay exact.

// 4500000 -> "45,000.00" (for layouts that style the ₹ symbol separately)
export const formatAmount = (paise) => amountFormatter.format((paise || 0) / 100);

// 4500000 -> "₹45,000.00"
export const formatCurrency = (paise) => `₹${formatAmount(paise)}`;

const RUPEES_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/;

// "1500.5" -> 150050. Parsed from the digits, not by multiplying a float (1.005 * 100 = 100.49999...).
// Returns null for anything that is not a positive rupee amount with at most 2 decimal places.
export const parseRupeesToPaise = (input) => {
  const match = RUPEES_PATTERN.exec(String(input ?? '').trim());
  if (!match) return null;

  const paise = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
  return Number.isSafeInteger(paise) && paise > 0 ? paise : null;
};

// MongoDB ObjectIds embed their creation time (seconds) in the first 4 bytes,
// so documents saved before timestamps were enabled still get a date
export const getCreatedAt = (doc) => {
  if (doc?.createdAt) return new Date(doc.createdAt);

  if (typeof doc?._id === 'string' && doc._id.length === 24) {
    return new Date(parseInt(doc._id.substring(0, 8), 16) * 1000);
  }

  return null;
};

// "23 Oct 2026, 1:45 pm"
export const formatDateTime = (date) => (date ? dateTimeFormatter.format(new Date(date)) : '—');

// "23 Oct 2026"
export const formatDate = (date) => (date ? dateFormatter.format(new Date(date)) : '—');

// "6adb0b980b905bafd35e2ca1" -> "…2ca1"
export const shortId = (id) => (id ? `…${String(id).slice(-4)}` : '—');

// "6adb0b980b905bafd35e2ca1" -> "Account ending 2ca1"
export const accountLabel = (id) => `Account ending ${String(id).slice(-4)}`;
