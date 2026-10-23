import React, { useState } from 'react';
import { StatusBadge } from '../components/common/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { useAdminTransactions } from '../hooks/queries';
import { formatCurrency } from '../utils/format';
import { Receipt, Search } from 'lucide-react';

const columns = [
  { key: '_id', header: 'Txn ID', className: 'font-mono font-semibold text-slate-200' },
  { key: 'fromAccount', header: 'From Account', className: 'font-mono text-slate-400' },
  { key: 'toAccount', header: 'To Account', className: 'font-mono text-slate-400' },
  { key: 'amount', header: 'Amount', className: 'font-extrabold text-white text-sm', render: (t) => formatCurrency(t.amount) },
  { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  { key: 'idempotencyKey', header: 'Idempotency Key', className: 'font-mono text-[11px] text-slate-400 truncate max-w-xs' },
];

export const AdminTransactions = () => {
  const { data: transactions = [], isLoading, error, refetch } = useAdminTransactions();
  const [search, setSearch] = useState('');

  const query = search.toLowerCase();
  const filtered = transactions.filter((t) =>
    [t._id, t.fromAccount, t.toAccount, t.idempotencyKey].some((value) => (value || '').toLowerCase().includes(query))
  );

  return (
    <>
      <PageHeader
        icon={Receipt}
        title="All System Transactions"
        description="Audit transactions, processing statuses, and idempotency keys"
        actions={
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Txn ID / Account / Key..."
              aria-label="Search transactions"
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
            />
          </div>
        }
      />

      <Card>
        <DataTable
          columns={columns}
          rows={filtered}
          loading={isLoading}
          error={error?.message}
          onRetry={() => refetch()}
          emptyTitle={transactions.length === 0 ? 'No transactions yet' : 'No transactions match your search'}
        />
      </Card>
    </>
  );
};
