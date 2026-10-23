import React from 'react';
import { StatCard } from '../components/common/StatCard';
import { UserManagementPanel } from '../components/admin/UserManagementPanel';
import { BlockedTokensTable } from '../components/admin/BlockedTokensTable';
import { PageHeader } from '../components/ui/PageHeader';
import { useAdminLedger, useAdminTransactions, useAdminUsers, useBlockedTokens } from '../hooks/queries';
import { formatCurrency } from '../utils/format';
import { ShieldCheck, Users, BookOpenCheck, ShieldAlert, DollarSign } from 'lucide-react';

export const AdminDashboard = () => {
  const { data: users = [] } = useAdminUsers();
  const { data: ledgerEntries = [] } = useAdminLedger();
  const { data: transactions = [] } = useAdminTransactions();
  const tokensQuery = useBlockedTokens();
  const blockedTokens = tokensQuery.data ?? [];

  // Each transfer writes a DEBIT and a CREDIT entry, so summing ledger entries would
  // count every rupee twice. Volume is the total of completed transactions instead.
  const totalVolume = transactions
    .filter((t) => t.status === 'COMPLETED')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <>
      <PageHeader
        badge={
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4" /> Admin Command Center
          </div>
        }
        title="System Administration & Ledger Control"
        description="Approve user accounts, inspect system-wide ledger entries, monitor blocked tokens, and disburse initial funds."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Registered Users" value={users.length.toString()} subtitle="Accounts in system" icon={Users} />
        <StatCard title="Total Ledger Entries" value={ledgerEntries.length.toString()} subtitle="Credit/Debit entries" icon={BookOpenCheck} />
        <StatCard title="Total System Volume" value={formatCurrency(totalVolume)} subtitle="Processed volume" icon={DollarSign} />
        <StatCard title="Blocked Tokens" value={blockedTokens.length.toString()} subtitle="Revoked JWTs" icon={ShieldAlert} />
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
