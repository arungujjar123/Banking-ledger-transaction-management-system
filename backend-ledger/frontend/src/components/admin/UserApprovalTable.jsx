import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { DataTable } from '../ui/DataTable';
import { formatDate } from '../../utils/format';
import { CheckCircle2, AlertOctagon, DollarSign, Shield } from 'lucide-react';

export const UserApprovalTable = ({ users = [], loading = false, error = null, onRetry, onUpdateStatus, onDisburseInitialFunds }) => {
  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <>
          <div className="font-semibold text-slate-200">{u.name}</div>
          <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
        </>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) =>
        u.systemUser ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Shield className="w-3 h-3" /> SYSTEM ADMIN
          </span>
        ) : (
          <span className="text-slate-400 font-medium">Standard User</span>
        ),
    },
    { key: 'status', header: 'Account Status', render: (u) => <StatusBadge status={u.status || 'PENDING'} /> },
    { key: 'createdAt', header: 'Registered Date', className: 'text-slate-400', render: (u) => formatDate(u.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-2">
          {u.status !== 'ACTIVE' && (
            <Button
              variant="solid"
              size="sm"
              icon={CheckCircle2}
              onClick={() => onUpdateStatus(u._id, 'ACTIVE')}
              title="Approve user registration and activate account"
              className="px-3 py-1.5 rounded-xl font-extrabold"
            >
              Approve Account
            </Button>
          )}

          {u.status === 'ACTIVE' && !u.systemUser && (
            <Button variant="info" size="sm" icon={AlertOctagon} onClick={() => onUpdateStatus(u._id, 'FROZEN')}>
              Freeze
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={DollarSign}
            onClick={() => onDisburseInitialFunds(u)}
            title="Disburse initial funds from System user"
            className="text-emerald-400"
          >
            Disburse Funds
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Registered Users & Account Approvals"
        subtitle="Review pending accounts, approve registered users, freeze or disburse funds"
      />
      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyTitle="No registered users yet"
      />
    </Card>
  );
};
