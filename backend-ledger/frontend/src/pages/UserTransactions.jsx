import React, { useState } from 'react';
import { LedgerTable } from '../components/user/LedgerTable';
import { TransferModal } from '../components/user/TransferModal';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { useAccounts, useLedger } from '../hooks/queries';
import { ArrowLeftRight, Plus } from 'lucide-react';

export const UserTransactions = () => {
  const ledgerQuery = useLedger();
  const { data: userAccounts = [] } = useAccounts();
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  return (
    <>
      <PageHeader
        icon={ArrowLeftRight}
        title="Transactions & Double-Entry Ledger"
        description="Audit history of all credits, debits, and fund transfers from MongoDB"
        actions={
          <Button variant="solid" icon={Plus} onClick={() => setIsTransferOpen(true)}>
            New Transfer
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
