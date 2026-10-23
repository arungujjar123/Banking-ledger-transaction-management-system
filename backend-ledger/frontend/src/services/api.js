import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

// A 401 from any protected API means the session expired or was revoked.
// Auth routes are excluded: a 401 there is a wrong password, not an expired session.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url?.startsWith('/auth/');

    if (err.response?.status === 401 && !isAuthRoute && unauthorizedHandler) {
      unauthorizedHandler();
    }

    return Promise.reject(err);
  }
);

export const generateIdempotencyKey = () => {
  return 'ik_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
};

export const authService = {
  login: async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: 'Login failed' };
    }
  },

  register: async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: 'Registration failed' };
    }
  },

  demoLogin: async () => {
    try {
      const res = await api.post('/auth/demo-login');
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: 'Demo login failed' };
    }
  },

  me: async () => {
    try {
      const res = await api.get('/auth/me');
      return res.data.user;
    } catch (err) {
      throw { status: err.response?.status, ...(err.response?.data || { message: 'Session check failed' }) };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout request completed with warning', err);
    } finally {
      localStorage.removeItem('token');
    }
  },
};

export const accountService = {
  createAccount: async () => {
    try {
      const res = await api.post('/accounts');
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: 'Failed to create account' };
    }
  },

  getUserAccounts: async () => {
    try {
      const res = await api.get('/accounts');
      return res.data.accounts || [];
    } catch (err) {
      throw err.response?.data || { message: 'Failed to fetch accounts' };
    }
  },

  getAccountBalance: async (accountId) => {
    try {
      const res = await api.get(`/accounts/balance/${accountId}`);
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: 'Failed to fetch balance' };
    }
  },

  getUserLedger: async () => {
    try {
      const res = await api.get('/accounts/ledger');
      return res.data.entries || [];
    } catch (err) {
      throw err.response?.data || { message: 'Failed to fetch user ledger' };
    }
  }
};

export const transactionService = {
  createTransaction: async ({ fromAccount, toAccount, amount, idempotencyKey }) => {
    try {
      const res = await api.post('/transactions', {
        fromAccount,
        toAccount,
        amount: Number(amount),
        idempotencyKey: idempotencyKey || generateIdempotencyKey(),
      });
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: 'Transaction failed' };
    }
  },

  createInitialFunds: async ({ toAccount, amount, idempotencyKey }) => {
    try {
      const res = await api.post('/transactions/system/initial-funds', {
        toAccount,
        amount: Number(amount),
        idempotencyKey: idempotencyKey || generateIdempotencyKey(),
      });
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: 'Initial funding failed' };
    }
  },
};

// Pure Database Services for Admin Panel (No Mock Fallbacks)
export const adminService = {
  getAllUsers: async () => {
    try {
      const res = await api.get('/admin/users');
      return res.data.users || [];
    } catch (err) {
      throw err.response?.data || { message: 'Failed to fetch users from database' };
    }
  },

  getAllLedgerEntries: async () => {
    try {
      const res = await api.get('/admin/ledger');
      return res.data.entries || [];
    } catch (err) {
      throw err.response?.data || { message: 'Failed to fetch ledger entries from database' };
    }
  },

  getBlockedTokens: async () => {
    try {
      const res = await api.get('/admin/blocked-tokens');
      return res.data.tokens || [];
    } catch (err) {
      throw err.response?.data || { message: 'Failed to fetch blocked tokens from database' };
    }
  },

  getAllTransactions: async () => {
    try {
      const res = await api.get('/admin/transactions');
      return res.data.transactions || [];
    } catch (err) {
      throw err.response?.data || { message: 'Failed to fetch transactions from database' };
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { status });
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: 'Failed to update user status in database' };
    }
  }
};

export default api;
