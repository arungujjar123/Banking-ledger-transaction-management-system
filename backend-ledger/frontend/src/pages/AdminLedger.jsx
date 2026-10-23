import React from 'react';
import { LedgerTable } from '../components/user/LedgerTable';
import { PageHeader } from '../components/ui/PageHeader';
import { useAdminLedger } from '../hooks/queries';
import { BookOpenCheck } from 'lucide-react';

export const AdminLedger = () => {
  const { data: entries = [], isLoading, error, refetch } = useAdminLedger();

  return (
    <>
      <PageHeader
        icon={BookOpenCheck}
        title="Global System Ledger"
        description="Complete double-entry audit history across all system accounts"
      />

      <LedgerTable entries={entries} loading={isLoading} error={error?.message} onRetry={() => refetch()} />
    </>
  );
};
