import React, { useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { StatCard } from '../components/common/StatCard';
import { AccountCard } from '../components/user/AccountCard';
import { LedgerTable } from '../components/user/LedgerTable';
import { QuickActions } from '../components/user/QuickActions';
import { TransferModal } from '../components/user/TransferModal';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorState, LoadingCards } from '../components/ui/States';
import { useAccounts, useCreateAccount, useLedger } from '../hooks/queries';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, RefreshCw } from 'lucide-react';

export const UserDashboard = () => {
  const { user, role } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;

  const accountsQuery = useAccounts();
  const ledgerQuery = useLedger(role === 'admin' ? 'all' : 'mine');
  const createAccount = useCreateAccount();

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedFromAccount, setSelectedFromAccount] = useState('');

  const accounts = accountsQuery.data ?? [];
  const ledgerEntries = ledgerQuery.data ?? [];

  const handleCreateAccount = async () => {
    try {
      await createAccount.mutateAsync();
      showSuccess('New account provisioned successfully!');
    } catch (err) {
      showError(err.message || 'Failed to create account');
    }
  };

  const handleOpenTransfer = (accId = '') => {
    setSelectedFromAccount(accId);
    setIsTransferOpen(true);
  };

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE').length;
  const totalCredits = ledgerEntries.filter((e) => e.type === 'CREDIT').reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalDebits = ledgerEntries.filter((e) => e.type === 'DEBIT').reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <>
      <PageHeader
        title={<>Welcome back, <span className="text-emerald-400">{user?.name || 'User'}</span></>}
        description="Here is your live double-entry financial ledger overview."
        actions={
          <>
            <IconButton icon={RefreshCw} label="Refresh data" spinning={isFetching} onClick={() => queryClient.invalidateQueries()} />
            <Button variant="secondary" icon={Plus} onClick={handleCreateAccount} className="font-bold shadow-glow-emerald">
              New Account
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Active Accounts" value={activeAccounts.toString()} subtitle={`${accounts.length} total`} icon={Wallet} />
        <StatCard title="Total Ledger Credits" value={formatCurrency(totalCredits)} subtitle="Incoming credit volume" icon={ArrowDownLeft} />
        <StatCard title="Total Ledger Debits" value={formatCurrency(totalDebits)} subtitle="Outgoing debit volume" icon={ArrowUpRight} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Your Financial Accounts</h2>
          <span className="text-xs text-slate-400">{accounts.length} total</span>
        </div>

        {accountsQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <LoadingCards count={2} />
          </div>
        ) : accountsQuery.error ? (
          <Card className="p-0">
            <ErrorState message={accountsQuery.error.message} onRetry={() => accountsQuery.refetch()} />
          </Card>
        ) : accounts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-slate-400 text-sm mb-3">No accounts provisioned yet.</p>
            <Button variant="solid" onClick={handleCreateAccount}>
              Create First Account
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <AccountCard key={acc._id} account={acc} onSelectForTransfer={handleOpenTransfer} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <QuickActions onCreateAccount={handleCreateAccount} onOpenTransfer={() => handleOpenTransfer()} />
        </div>
        <div className="lg:col-span-2">
          <LedgerTable
            entries={ledgerEntries}
            loading={ledgerQuery.isLoading}
            error={ledgerQuery.error?.message}
            onRetry={() => ledgerQuery.refetch()}
          />
        </div>
      </div>

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        userAccounts={accounts}
        defaultFromAccount={selectedFromAccount}
      />
    </>
  );
};
