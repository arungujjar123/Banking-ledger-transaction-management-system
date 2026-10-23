import React from 'react';
import { BlockedTokensTable } from '../components/admin/BlockedTokensTable';
import { PageHeader } from '../components/ui/PageHeader';
import { useBlockedTokens } from '../hooks/queries';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const AdminBlockedTokens = () => {
  useDocumentTitle('Blocked tokens');
  const { data: tokens = [], isLoading, error, refetch } = useBlockedTokens();

  return (
    <>
      <PageHeader title="Blocked tokens" description="Logged-out sessions can never be reused, even before the token expires." />
      <BlockedTokensTable tokens={tokens} loading={isLoading} error={error?.message} onRetry={() => refetch()} />
    </>
  );
};
