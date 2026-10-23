const amountFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
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

export const formatDateTime = (date) => (date ? new Date(date).toLocaleString() : '—');

export const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '—');
