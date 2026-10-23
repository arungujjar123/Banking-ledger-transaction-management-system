import React, { useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw } from 'lucide-react';
import { AccountCard } from '../components/user/AccountCard';
import { TransferModal } from '../components/user/TransferModal';
import { AccountStatusBanner } from '../components/user/AccountStatusBanner';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingCards } from '../components/ui/States';
import { useAccounts, useCreateAccount } from '../hooks/queries';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../context/ToastContext';

export const UserAccounts = () => {
  useDocumentTitle('Accounts');
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
      showSuccess('New account created');
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
        title="Accounts"
        description="Balances are calculated from the ledger, never stored, so they always match your history."
        actions={
          <>
            <IconButton icon={RefreshCw} label="Refresh balances" spinning={isFetching} onClick={() => queryClient.invalidateQueries()} />
            <Button icon={Plus} onClick={handleCreateAccount} loading={createAccount.isPending}>
              New account
            </Button>
          </>
        }
      />

      <AccountStatusBanner accounts={accounts} />

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
