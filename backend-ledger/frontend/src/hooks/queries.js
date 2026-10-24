import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountService, adminService, transactionService } from '../services/api';

export const queryKeys = {
  accounts: ['accounts'],
  ledger: ['ledger'],
  balance: (accountId) => ['balance', accountId],
  lookup: (accountId) => ['lookup', accountId],
  admin: {
    all: ['admin'],
    users: ['admin', 'users'],
    ledger: ['admin', 'ledger'],
    transactions: ['admin', 'transactions'],
    tokens: ['admin', 'tokens'],
  },
};

// ---------- User data ----------

export const useAccounts = () =>
  useQuery({ queryKey: queryKeys.accounts, queryFn: accountService.getUserAccounts });

// 'mine' = the logged-in user's entries, 'all' = system-wide (admin only)
export const useLedger = (scope = 'mine') =>
  useQuery(
    scope === 'all'
      ? { queryKey: queryKeys.admin.ledger, queryFn: adminService.getAllLedgerEntries }
      : { queryKey: queryKeys.ledger, queryFn: accountService.getUserLedger }
  );

const balanceQuery = (accountId) => ({
  queryKey: queryKeys.balance(accountId),
  queryFn: () => accountService.getAccountBalance(accountId).then((data) => data.balance),
});

export const useAccountBalance = (accountId) =>
  useQuery({ ...balanceQuery(accountId), enabled: Boolean(accountId) });

// Sum of several balances; shares the cache with each account card's own balance query
export const useTotalBalance = (accountIds) =>
  useQueries({
    queries: accountIds.map(balanceQuery),
    combine: (results) => ({
      total: results.reduce((sum, r) => sum + (r.data || 0), 0),
      isLoading: results.some((r) => r.isLoading),
    }),
  });

// Only runs for a well-formed ID; a 404 here is an answer ("no such account"), not a failure to retry
export const useAccountLookup = (accountId) =>
  useQuery({
    queryKey: queryKeys.lookup(accountId),
    queryFn: () => accountService.lookupAccount(accountId),
    enabled: /^[a-f\d]{24}$/i.test(accountId || ''),
    retry: false,
    staleTime: 60 * 1000,
  });

export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountService.createAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
};

// A transfer changes accounts, balances and ledger entries, so all of them are refetched
export const useCreateTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionService.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger });
    },
  });
};

// ---------- Admin data ----------

export const useAdminUsers = () =>
  useQuery({ queryKey: queryKeys.admin.users, queryFn: adminService.getAllUsers });

export const useAdminLedger = () => useLedger('all');

export const useAdminTransactions = () =>
  useQuery({ queryKey: queryKeys.admin.transactions, queryFn: adminService.getAllTransactions });

export const useBlockedTokens = () =>
  useQuery({ queryKey: queryKeys.admin.tokens, queryFn: adminService.getBlockedTokens });

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }) => adminService.updateUserStatus(userId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.users }),
  });
};

// A reversal moves money and changes the original's status, so every admin view is refetched
export const useReverseTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.reverseTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });
};

export const useDisburseFunds = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionService.createInitialFunds,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
    },
  });
};
