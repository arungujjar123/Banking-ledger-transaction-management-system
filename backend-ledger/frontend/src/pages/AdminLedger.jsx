import React from 'react';
import { LedgerTable } from '../components/user/LedgerTable';
import { PageHeader } from '../components/ui/PageHeader';
import { useAdminLedger } from '../hooks/queries';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const AdminLedger = () => {
  useDocumentTitle('Global ledger');
  const { data: entries = [], isLoading, error, refetch } = useAdminLedger();

  return (
    <>
      <PageHeader title="Global ledger" description="Every debit and credit entry across all accounts in the system." />
      <LedgerTable
        entries={entries}
        loading={isLoading}
        error={error?.message}
        onRetry={() => refetch()}
        title="All ledger entries"
        subtitle="Entries are immutable: the database rejects any update or delete."
      />
    </>
  );
};
