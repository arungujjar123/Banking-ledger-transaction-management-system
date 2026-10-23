import React from 'react';
import { Card, CardHeader } from '../ui/Card';
import { DataTable } from '../ui/DataTable';
import { formatDateTime, shortId } from '../../utils/format';

const columns = [
  { key: 'createdAt', header: 'Revoked at', className: 'text-muted whitespace-nowrap', render: (item) => formatDateTime(item.createdAt) },
  {
    key: 'token',
    header: 'Token',
    className: 'font-mono text-xs text-subtle max-w-xs truncate',
    render: (item) => (item.token ? item.token.substring(0, 32) + '…' : 'Revoked'),
  },
  { key: 'reason', header: 'Reason', className: 'text-muted', render: (item) => item.reason || 'User logout' },
  { key: '_id', header: 'Record', className: 'font-mono text-[13px] text-subtle', render: (item) => <span title={item._id}>{shortId(item._id)}</span> },
];

export const BlockedTokensTable = ({ tokens = [], loading = false, error = null, onRetry }) => (
  <Card className="p-0">
    <CardHeader divided title="Blocked tokens" subtitle="Sign-in tokens revoked when users log out. They expire from this list after 3 days." />
    <DataTable
      columns={columns}
      rows={tokens}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No blocked tokens"
      emptyDescription="Tokens appear here when users log out."
    />
  </Card>
);
