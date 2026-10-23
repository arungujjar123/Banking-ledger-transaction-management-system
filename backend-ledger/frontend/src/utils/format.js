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

// 45000 -> "45,000.00" (for layouts that style the ₹ symbol separately)
export const formatAmount = (amount) => amountFormatter.format(amount || 0);

// 45000 -> "₹45,000.00"
export const formatCurrency = (amount) => `₹${formatAmount(amount)}`;

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
