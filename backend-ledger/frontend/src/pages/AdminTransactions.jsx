import React, { useState } from 'react';
import { Undo2 } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { ReverseTransactionModal } from '../components/admin/ReverseTransactionModal';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { SearchInput } from '../components/ui/SearchInput';
import { useAdminTransactions } from '../hooks/queries';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatCurrency, formatDateTime, getCreatedAt, shortId } from '../utils/format';

const idCell = (id) => <span title={id}>{shortId(id)}</span>;

// A reversal row names the transfer it undoes; hovering shows the admin's reason
const StatusCell = ({ transaction: t }) => (
  <div>
    <StatusBadge status={t.status} />
    {t.reversalOf && (
      <div className="text-xs text-subtle mt-1 whitespace-nowrap" title={t.reason}>
        Reversal of <span className="font-mono">{shortId(t.reversalOf)}</span>
      </div>
    )}
  </div>
);

const canReverse = (t) => t.status === 'COMPLETED' && !t.reversalOf;

const buildColumns = (onReverse) => [
  { key: 'createdAt', header: 'Date', className: 'text-muted whitespace-nowrap', render: (t) => formatDateTime(getCreatedAt(t)) },
  { key: 'fromAccount', header: 'From', className: 'font-mono text-[13px] text-muted', render: (t) => idCell(t.fromAccount) },
  { key: 'toAccount', header: 'To', className: 'font-mono text-[13px] text-muted', render: (t) => idCell(t.toAccount) },
  { key: 'status', header: 'Status', render: (t) => <StatusCell transaction={t} /> },
  { key: 'idempotencyKey', header: 'Idempotency key', className: 'font-mono text-xs text-subtle max-w-[220px] truncate' },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    className: 'font-semibold tabular-nums whitespace-nowrap',
    render: (t) => formatCurrency(t.amount),
  },
  {
    key: 'actions',
    header: <span className="sr-only">Actions</span>,
    align: 'right',
    render: (t) =>
      canReverse(t) && (
        <Button variant="secondary" size="sm" icon={Undo2} onClick={() => onReverse(t)}>
          Reverse
        </Button>
      ),
  },
];

export const AdminTransactions = () => {
  useDocumentTitle('All transactions');
  const { data: transactions = [], isLoading, error, refetch } = useAdminTransactions();
  const [search, setSearch] = useState('');
  const [reversing, setReversing] = useState(null);

  const query = search.toLowerCase();
  const filtered = transactions.filter((t) =>
    [t._id, t.fromAccount, t.toAccount, t.idempotencyKey, t.reversalOf].some((value) => (value || '').toLowerCase().includes(query))
  );

  return (
    <>
      <PageHeader
        title="All transactions"
        description="Every transfer in the system with its status and idempotency key. A completed transfer can be reversed with a new, opposite transfer."
      />

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
          columns={buildColumns(setReversing)}
          rows={filtered}
          loading={isLoading}
          error={error?.message}
          onRetry={() => refetch()}
          emptyTitle={transactions.length === 0 ? 'No transactions yet' : 'No transactions match your search'}
          minWidth={860}
        />
      </Card>

      <ReverseTransactionModal transaction={reversing} onClose={() => setReversing(null)} />
    </>
  );
};
