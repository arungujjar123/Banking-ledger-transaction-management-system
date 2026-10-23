import React from 'react';
import { Users, BookOpenCheck, ShieldAlert, IndianRupee } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/StatusBadge';
import { UserManagementPanel } from '../components/admin/UserManagementPanel';
import { BlockedTokensTable } from '../components/admin/BlockedTokensTable';
import { PageHeader } from '../components/ui/PageHeader';
import { useAdminLedger, useAdminTransactions, useAdminUsers, useBlockedTokens } from '../hooks/queries';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatCurrency } from '../utils/format';

export const AdminDashboard = () => {
  useDocumentTitle('Admin overview');
  const { data: users = [] } = useAdminUsers();
  const { data: ledgerEntries = [] } = useAdminLedger();
  const { data: transactions = [] } = useAdminTransactions();
  const tokensQuery = useBlockedTokens();
  const blockedTokens = tokensQuery.data ?? [];

  // Each transfer writes a DEBIT and a CREDIT entry, so summing ledger entries would
  // count every rupee twice. Volume is the total of completed transactions instead.
  const completed = transactions.filter((t) => t.status === 'COMPLETED');
  const totalVolume = completed.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <>
      <PageHeader
        badge={<Badge tone="info" className="mb-2">Admin console</Badge>}
        title="System overview"
        description="Approve users, fund accounts and audit every ledger movement."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Registered users" value={users.length.toString()} subtitle="Including the system admin" icon={Users} />
        <StatCard title="Ledger entries" value={ledgerEntries.length.toString()} subtitle="Debits and credits" icon={BookOpenCheck} />
        <StatCard title="Total volume" value={formatCurrency(totalVolume)} subtitle={`${completed.length} completed transfers`} icon={IndianRupee} tone="credit" />
        <StatCard title="Blocked tokens" value={blockedTokens.length.toString()} subtitle="Revoked on logout" icon={ShieldAlert} />
      </div>

      <UserManagementPanel />

      <BlockedTokensTable
        tokens={blockedTokens}
        loading={tokensQuery.isLoading}
        error={tokensQuery.error?.message}
        onRetry={() => tokensQuery.refetch()}
      />
    </>
  );
};
