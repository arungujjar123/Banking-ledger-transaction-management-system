import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountService, adminService, transactionService } from '../services/api';

export const queryKeys = {
  accounts: ['accounts'],
  ledger: ['ledger'],
  balance: (accountId) => ['balance', accountId],
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

export const useAccountBalance = (accountId) =>
  useQuery({
    queryKey: queryKeys.balance(accountId),
    queryFn: () => accountService.getAccountBalance(accountId).then((data) => data.balance),
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
