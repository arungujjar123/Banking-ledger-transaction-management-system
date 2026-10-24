import React, { useState } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, Send } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { AccountCard } from '../components/user/AccountCard';
import { LedgerTable } from '../components/user/LedgerTable';
import { TransferModal } from '../components/user/TransferModal';
import { AccountStatusBanner } from '../components/user/AccountStatusBanner';
import { ApprovalRequests } from '../components/user/ApprovalRequests';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingCards } from '../components/ui/States';
import { useAccounts, useCreateAccount, useLedger, useTotalBalance } from '../hooks/queries';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/format';

export const UserDashboard = () => {
  useDocumentTitle('Overview');
  const { user, role } = useAuth();
  const { showSuccess, showError } = useToast();

  const accountsQuery = useAccounts();
  const ledgerQuery = useLedger(role === 'admin' ? 'all' : 'mine');
  const createAccount = useCreateAccount();

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedFromAccount, setSelectedFromAccount] = useState('');

  const accounts = accountsQuery.data ?? [];
  const ledgerEntries = ledgerQuery.data ?? [];
  const totalBalance = useTotalBalance(accounts.map((a) => a._id));

  const handleCreateAccount = async () => {
    try {
      await createAccount.mutateAsync();
      showSuccess('New account created');
    } catch (err) {
      showError(err.message || 'Failed to create account');
    }
  };

  const handleOpenTransfer = (accId = '') => {
    setSelectedFromAccount(accId);
    setIsTransferOpen(true);
  };

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE').length;
  const canTransfer = activeAccounts > 0;
  const totalCredits = ledgerEntries.filter((e) => e.type === 'CREDIT').reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalDebits = ledgerEntries.filter((e) => e.type === 'DEBIT').reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name || 'there'}`}
        description="Here is an overview of your accounts and recent ledger activity."
        actions={
          <>
            <Button variant="secondary" icon={Plus} onClick={handleCreateAccount} loading={createAccount.isPending}>
              New account
            </Button>
            <Button
              icon={Send}
              onClick={() => handleOpenTransfer()}
              disabled={!canTransfer}
              title={canTransfer ? undefined : 'Available once an account is approved'}
            >
              Transfer funds
            </Button>
          </>
        }
      />

      <AccountStatusBanner accounts={accounts} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total balance"
          value={accountsQuery.isLoading || totalBalance.isLoading ? '…' : formatCurrency(totalBalance.total)}
          subtitle={`${activeAccounts} of ${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'} active`}
          icon={Wallet}
        />
        <StatCard title="Total credits" value={formatCurrency(totalCredits)} subtitle="Money received" icon={ArrowDownLeft} tone="credit" />
        <StatCard title="Total debits" value={formatCurrency(totalDebits)} subtitle="Money sent" icon={ArrowUpRight} tone="debit" />
      </div>

      <section aria-labelledby="accounts-heading" className="space-y-3">
        <h2 id="accounts-heading" className="text-[17px] font-semibold text-fg">Your accounts</h2>

        {accountsQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LoadingCards count={2} />
          </div>
        ) : accountsQuery.error ? (
          <Card className="p-0">
            <ErrorState message={accountsQuery.error.message} onRetry={() => accountsQuery.refetch()} />
          </Card>
        ) : accounts.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              title="No accounts yet"
              description="Create your first account to start receiving and sending funds."
              action={<Button onClick={handleCreateAccount}>Create first account</Button>}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <AccountCard key={acc._id} account={acc} onSelectForTransfer={handleOpenTransfer} />
            ))}
          </div>
        )}
      </section>

      <ApprovalRequests />

      <LedgerTable
        entries={ledgerEntries}
        loading={ledgerQuery.isLoading}
        error={ledgerQuery.error?.message}
        onRetry={() => ledgerQuery.refetch()}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        userAccounts={accounts}
        defaultFromAccount={selectedFromAccount}
      />
    </>
  );
};
