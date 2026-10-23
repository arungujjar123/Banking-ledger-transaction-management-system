import React from 'react';
import { CheckCircle2, Snowflake, IndianRupee } from 'lucide-react';
import { Badge, StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { DataTable } from '../ui/DataTable';
import { formatDate } from '../../utils/format';

export const UserApprovalTable = ({ users = [], loading = false, error = null, onRetry, onUpdateStatus, onDisburseInitialFunds }) => {
  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <>
          <div className="font-semibold text-fg">{u.name}</div>
          <div className="text-xs text-subtle mt-0.5">{u.email}</div>
        </>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (u.systemUser ? <Badge tone="info">System admin</Badge> : <span className="text-muted">User</span>),
    },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status || 'PENDING'} /> },
    { key: 'createdAt', header: 'Registered', className: 'text-muted whitespace-nowrap', render: (u) => formatDate(u.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          {u.status !== 'ACTIVE' && (
            <Button size="sm" icon={CheckCircle2} onClick={() => onUpdateStatus(u._id, 'ACTIVE')}>
              Approve
            </Button>
          )}

          {u.status === 'ACTIVE' && !u.systemUser && (
            <Button variant="danger" size="sm" icon={Snowflake} onClick={() => onUpdateStatus(u._id, 'FROZEN')}>
              Freeze
            </Button>
          )}

          <Button variant="secondary" size="sm" icon={IndianRupee} onClick={() => onDisburseInitialFunds(u)}>
            Add funds
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="p-0">
      <CardHeader divided title="Users" subtitle="Approve new accounts, freeze active ones, or add initial funds." />
      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyTitle="No registered users yet"
        minWidth={760}
      />
    </Card>
  );
};
