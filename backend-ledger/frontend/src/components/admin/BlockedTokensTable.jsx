import React from 'react';
import { Card, CardHeader } from '../ui/Card';
import { DataTable } from '../ui/DataTable';
import { formatDateTime, shortId } from '../../utils/format';

// Matches the TTL index on the backend's tokenBlackList model
const BLACKLIST_TTL_MS = 3 * 24 * 60 * 60 * 1000;

// The token itself is never shown: even a revoked JWT is a credential-shaped secret
const columns = [
  { key: 'createdAt', header: 'Revoked at', className: 'text-muted whitespace-nowrap', render: (item) => formatDateTime(item.createdAt) },
  { key: 'reason', header: 'Reason', className: 'text-muted', render: (item) => item.reason || 'User logout' },
  {
    key: 'expires',
    header: 'Removed from list',
    className: 'text-muted whitespace-nowrap',
    render: (item) => (item.createdAt ? formatDateTime(new Date(item.createdAt).getTime() + BLACKLIST_TTL_MS) : '—'),
  },
  { key: '_id', header: 'Record', className: 'font-mono text-[13px] text-subtle', render: (item) => <span title={item._id}>{shortId(item._id)}</span> },
];

export const BlockedTokensTable = ({ tokens = [], loading = false, error = null, onRetry }) => (
  <Card className="p-0">
    <CardHeader divided title="Blocked tokens" subtitle="Sign-in tokens revoked when users log out. Each record is removed automatically after 3 days." />
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
