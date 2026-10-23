import React, { useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { AccountCard } from '../components/user/AccountCard';
import { TransferModal } from '../components/user/TransferModal';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingCards } from '../components/ui/States';
import { useAccounts, useCreateAccount } from '../hooks/queries';
import { useToast } from '../context/ToastContext';
import { CreditCard, Plus, RefreshCw } from 'lucide-react';

export const UserAccounts = () => {
  const { data: accounts = [], isLoading, error, refetch } = useAccounts();
  const createAccount = useCreateAccount();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedFromAccount, setSelectedFromAccount] = useState('');
  const { showSuccess, showError } = useToast();

  const handleCreateAccount = async () => {
    try {
      await createAccount.mutateAsync();
      showSuccess('Account provisioned successfully');
    } catch (e) {
      showError(e.message || 'Error creating account');
    }
  };

  const handleOpenTransfer = (accId = '') => {
    setSelectedFromAccount(accId);
    setIsTransferOpen(true);
  };

  return (
    <>
      <PageHeader
        icon={CreditCard}
        title="Accounts & Balances"
        description="Manage your financial accounts and view real-time double-entry balances"
        actions={
          <>
            <IconButton icon={RefreshCw} label="Refresh" spinning={isFetching} onClick={() => queryClient.invalidateQueries()} />
            <Button variant="solid" icon={Plus} onClick={handleCreateAccount}>
              Provision New Account
            </Button>
          </>
        }
      />

      {error ? (
        <Card className="p-0">
          <ErrorState message={error.message} onRetry={() => refetch()} />
        </Card>
      ) : !isLoading && accounts.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title="No accounts yet"
            description="Create your first account to start receiving and sending funds."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <LoadingCards count={3} />
          ) : (
            accounts.map((acc) => (
              <AccountCard key={acc._id} account={acc} onSelectForTransfer={handleOpenTransfer} />
            ))
          )}
        </div>
      )}

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        userAccounts={accounts}
        defaultFromAccount={selectedFromAccount}
      />
    </>
  );
};
