import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { LedgerTable } from '../components/user/LedgerTable';
import { TransferModal } from '../components/user/TransferModal';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { useAccounts, useLedger } from '../hooks/queries';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const UserTransactions = () => {
  useDocumentTitle('Transactions');
  const ledgerQuery = useLedger();
  const { data: userAccounts = [] } = useAccounts();
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Transactions"
        description="The full debit and credit history of your accounts."
        actions={
          <Button
            icon={Send}
            onClick={() => setIsTransferOpen(true)}
            disabled={!userAccounts.some((a) => a.status === 'ACTIVE')}
          >
            Transfer funds
          </Button>
        }
      />

      <LedgerTable
        entries={ledgerQuery.data ?? []}
        loading={ledgerQuery.isLoading}
        error={ledgerQuery.error?.message}
        onRetry={() => ledgerQuery.refetch()}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        userAccounts={userAccounts}
      />
    </>
  );
};
