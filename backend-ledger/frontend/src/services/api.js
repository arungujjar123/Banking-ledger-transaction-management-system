import axios from 'axios';

// The session lives in an httpOnly cookie that the browser sends by itself. Page scripts
// never see the token, so an XSS bug cannot steal it.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

// Every failed request rejects with a plain { message, status } object, so callers
// never need to dig through axios internals.
// A 401 from a protected API means the session expired or was revoked. Auth routes are
// excluded: a 401 there is a wrong password, not an expired session.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const isAuthRoute = err.config?.url?.startsWith('/auth/');

    if (status === 401 && !isAuthRoute && unauthorizedHandler) {
      unauthorizedHandler();
    }

    return Promise.reject({
      status,
      message: err.response?.data?.message
        || (err.response ? 'Something went wrong. Please try again.' : 'Network error. Please check your connection.'),
    });
  }
);

export const generateIdempotencyKey = () => crypto.randomUUID();

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }).then((res) => res.data),

  register: (name, email, password) => api.post('/auth/register', { name, email, password }).then((res) => res.data),

  demoLogin: () => api.post('/auth/demo-login').then((res) => res.data),

  me: () => api.get('/auth/me').then((res) => res.data.user),

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // The session may already be invalid; the local session is cleared either way
    }
  },
};

export const accountService = {
  createAccount: () => api.post('/accounts').then((res) => res.data),

  getUserAccounts: () => api.get('/accounts').then((res) => res.data.accounts || []),

  getAccountBalance: (accountId) => api.get(`/accounts/balance/${accountId}`).then((res) => res.data),

  getUserLedger: () => api.get('/accounts/ledger').then((res) => res.data.entries || []),

  // Masked owner name + status for confirming a transfer recipient
  lookupAccount: (accountId) => api.get(`/accounts/lookup/${accountId}`).then((res) => res.data),
};

export const transactionService = {
  createTransaction: ({ fromAccount, toAccount, amount, idempotencyKey }) =>
    api.post('/transactions', {
      fromAccount,
      toAccount,
      amount, // integer paise
      idempotencyKey: idempotencyKey || generateIdempotencyKey(),
    }).then((res) => res.data),

  // Transfer limits and what this account has left to send today (all amounts in paise)
  getLimits: (accountId) => api.get(`/transactions/limits/${accountId}`).then((res) => res.data),

  // The user's transfers waiting for, or recently rejected at, admin approval
  getMyApprovalRequests: () => api.get('/transactions/approvals').then((res) => res.data.transactions || []),

  createInitialFunds: ({ toAccount, amount, idempotencyKey }) =>
    api.post('/transactions/system/initial-funds', {
      toAccount,
      amount, // integer paise
      idempotencyKey: idempotencyKey || generateIdempotencyKey(),
    }).then((res) => res.data),
};

export const adminService = {
  getAllUsers: () => api.get('/admin/users').then((res) => res.data.users || []),

  getAllLedgerEntries: () => api.get('/admin/ledger').then((res) => res.data.entries || []),

  getBlockedTokens: () => api.get('/admin/blocked-tokens').then((res) => res.data.tokens || []),

  getAllTransactions: () => api.get('/admin/transactions').then((res) => res.data.transactions || []),

  updateUserStatus: (userId, status) => api.patch(`/admin/users/${userId}/status`, { status }).then((res) => res.data),

  getApprovals: () => api.get('/admin/approvals').then((res) => res.data.transactions || []),

  approveTransfer: (transactionId) => api.post(`/admin/approvals/${transactionId}/approve`).then((res) => res.data),

  rejectTransfer: ({ transactionId, reason }) =>
    api.post(`/admin/approvals/${transactionId}/reject`, { reason }).then((res) => res.data),

  reverseTransaction: ({ transactionId, reason, idempotencyKey }) =>
    api.post(`/admin/transactions/${transactionId}/reverse`, { reason, idempotencyKey }).then((res) => res.data),
};

export default api;
