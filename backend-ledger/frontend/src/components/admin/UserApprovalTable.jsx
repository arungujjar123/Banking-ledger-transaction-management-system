import React, { useState } from 'react';
import { CheckCircle2, Snowflake, IndianRupee, RotateCcw } from 'lucide-react';
import { Badge, StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { DataTable } from '../ui/DataTable';
import { SearchInput } from '../ui/SearchInput';
import { SegmentedControl } from '../ui/SegmentedControl';
import { formatDate } from '../../utils/format';

const STATUS_FILTERS = ['ALL', 'PENDING', 'ACTIVE', 'FROZEN'];
const FILTER_LABELS = { ALL: 'All', PENDING: 'Pending', ACTIVE: 'Active', FROZEN: 'Frozen' };

// The action that moves a non-active user back to ACTIVE depends on why they are not active
const REACTIVATE = {
  PENDING: { label: 'Approve', icon: CheckCircle2, variant: 'primary' },
  FROZEN: { label: 'Unfreeze', icon: RotateCcw, variant: 'secondary' },
  CLOSED: { label: 'Reopen', icon: RotateCcw, variant: 'secondary' },
};

const UserActions = ({ user, onUpdateStatus, onDisburseInitialFunds }) => {
  const status = user.status || 'PENDING';
  const reactivate = REACTIVATE[status];

  // The system admin's own account is the reserve that funds everyone else: no actions on it
  if (user.systemUser) {
    return <span className="text-[13px] text-subtle">System reserve</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {reactivate && (
        <Button variant={reactivate.variant} size="sm" icon={reactivate.icon} onClick={() => onUpdateStatus(user._id, 'ACTIVE')}>
          {reactivate.label}
        </Button>
      )}

      {status === 'ACTIVE' && (
        <Button variant="danger" size="sm" icon={Snowflake} onClick={() => onUpdateStatus(user._id, 'FROZEN')}>
          Freeze
        </Button>
      )}

      <Button variant="secondary" size="sm" icon={IndianRupee} onClick={() => onDisburseInitialFunds(user)}>
        Add funds
      </Button>
    </div>
  );
};

export const UserApprovalTable = ({ users = [], loading = false, error = null, onRetry, onUpdateStatus, onDisburseInitialFunds }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const countFor = (status) => (status === 'ALL' ? users.length : users.filter((u) => (u.status || 'PENDING') === status).length);
  const filterOptions = STATUS_FILTERS.map((status) => ({ value: status, label: `${FILTER_LABELS[status]} ${countFor(status)}` }));

  const query = search.trim().toLowerCase();
  const visibleUsers = users.filter((u) => {
    const matchesStatus = statusFilter === 'ALL' || (u.status || 'PENDING') === statusFilter;
    const matchesSearch = !query || [u.name, u.email].some((value) => (value || '').toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

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
      render: (u) => <UserActions user={u} onUpdateStatus={onUpdateStatus} onDisburseInitialFunds={onDisburseInitialFunds} />,
    },
  ];

  return (
    <Card className="p-0">
      <CardHeader
        divided
        title="Users"
        subtitle="Approve new accounts, freeze or unfreeze active ones, and add initial funds."
        actions={
          <>
            <SearchInput
              label="Search users by name or email"
              placeholder="Search users"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-52"
            />
            <SegmentedControl label="Filter by status" options={filterOptions} value={statusFilter} onChange={setStatusFilter} />
          </>
        }
      />
      <DataTable
        columns={columns}
        rows={visibleUsers}
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyTitle={users.length === 0 ? 'No registered users yet' : 'No users match these filters'}
        minWidth={760}
      />
    </Card>
  );
};
