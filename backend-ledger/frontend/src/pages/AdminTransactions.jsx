import React, { useState } from 'react';
import { StatusBadge } from '../components/common/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { SearchInput } from '../components/ui/SearchInput';
import { useAdminTransactions } from '../hooks/queries';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatCurrency, formatDateTime, getCreatedAt, shortId } from '../utils/format';

const idCell = (id) => <span title={id}>{shortId(id)}</span>;

const columns = [
  { key: 'createdAt', header: 'Date', className: 'text-muted whitespace-nowrap', render: (t) => formatDateTime(getCreatedAt(t)) },
  { key: 'fromAccount', header: 'From', className: 'font-mono text-[13px] text-muted', render: (t) => idCell(t.fromAccount) },
  { key: 'toAccount', header: 'To', className: 'font-mono text-[13px] text-muted', render: (t) => idCell(t.toAccount) },
  { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  { key: 'idempotencyKey', header: 'Idempotency key', className: 'font-mono text-xs text-subtle max-w-[220px] truncate' },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    className: 'font-semibold tabular-nums whitespace-nowrap',
    render: (t) => formatCurrency(t.amount),
  },
];

export const AdminTransactions = () => {
  useDocumentTitle('All transactions');
  const { data: transactions = [], isLoading, error, refetch } = useAdminTransactions();
  const [search, setSearch] = useState('');

  const query = search.toLowerCase();
  const filtered = transactions.filter((t) =>
    [t._id, t.fromAccount, t.toAccount, t.idempotencyKey].some((value) => (value || '').toLowerCase().includes(query))
  );

  return (
    <>
      <PageHeader title="All transactions" description="Every transfer in the system with its status and idempotency key." />

      <Card className="p-0">
        <CardHeader
          divided
          title="Transactions"
          subtitle={`${transactions.length} total`}
          actions={
            <SearchInput
              label="Search by ID, account or key"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
          }
        />
        <DataTable
          columns={columns}
          rows={filtered}
          loading={isLoading}
          error={error?.message}
          onRetry={() => refetch()}
          emptyTitle={transactions.length === 0 ? 'No transactions yet' : 'No transactions match your search'}
          minWidth={760}
        />
      </Card>
    </>
  );
};
