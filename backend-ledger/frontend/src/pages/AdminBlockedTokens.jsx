import React from 'react';
import { BlockedTokensTable } from '../components/admin/BlockedTokensTable';
import { PageHeader } from '../components/ui/PageHeader';
import { useBlockedTokens } from '../hooks/queries';
import { ShieldAlert } from 'lucide-react';

export const AdminBlockedTokens = () => {
  const { data: tokens = [], isLoading, error, refetch } = useBlockedTokens();

  return (
    <>
      <PageHeader
        icon={ShieldAlert}
        iconClassName="text-rose-400"
        title="Blacklisted JWT Tokens"
        description="Security log of revoked JWT authorization tokens"
      />

      <BlockedTokensTable tokens={tokens} loading={isLoading} error={error?.message} onRetry={() => refetch()} />
    </>
  );
};
