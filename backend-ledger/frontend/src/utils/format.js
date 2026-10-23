// MongoDB ObjectIds embed their creation time (seconds) in the first 4 bytes,
// so documents saved before timestamps were enabled still get a date
export const getCreatedAt = (doc) => {
  if (doc?.createdAt) return new Date(doc.createdAt);

  if (typeof doc?._id === 'string' && doc._id.length === 24) {
    return new Date(parseInt(doc._id.substring(0, 8), 16) * 1000);
  }

  return null;
};
