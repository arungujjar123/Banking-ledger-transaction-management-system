import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { DataTable } from '../ui/DataTable';
import { formatDateTime } from '../../utils/format';

const columns = [
  { key: '_id', header: 'Record ID', className: 'font-mono font-medium text-slate-300' },
  {
    key: 'token',
    header: 'Revoked Token snippet',
    className: 'font-mono text-slate-400 max-w-xs truncate',
    render: (item) => (
      <span className="text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
        {item.token ? item.token.substring(0, 45) + '...' : '[REVOKED]'}
      </span>
    ),
  },
  { key: 'reason', header: 'Revocation Reason', className: 'font-semibold text-slate-300', render: (item) => item.reason || 'User Logout' },
  { key: 'createdAt', header: 'Blacklisted At', className: 'text-slate-400', render: (item) => formatDateTime(item.createdAt) },
];

export const BlockedTokensTable = ({ tokens = [], loading = false, error = null, onRetry }) => (
  <Card>
    <CardHeader
      title={<><ShieldAlert className="w-5 h-5 text-rose-400" /> Security & Blacklisted Tokens</>}
      subtitle="JWT tokens revoked upon user logout or security invalidation"
    />
    <DataTable
      columns={columns}
      rows={tokens}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No blocked tokens"
      emptyDescription="Tokens are revoked here when users log out."
    />
  </Card>
);
