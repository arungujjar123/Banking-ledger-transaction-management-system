import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { DataTable } from '../ui/DataTable';
import { cn } from '../../utils/cn';
import { formatCurrency, formatDateTime, getCreatedAt } from '../../utils/format';

const filters = [
  { value: 'ALL', label: 'All', active: 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' },
  { value: 'CREDIT', label: 'Credits', active: 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' },
  { value: 'DEBIT', label: 'Debits', active: 'bg-rose-950 text-rose-300 border border-rose-500/30' },
];

const columns = [
  { key: '_id', header: 'Entry ID', className: 'font-mono font-medium text-slate-300' },
  {
    key: 'type',
    header: 'Type',
    render: (entry) =>
      entry.type === 'CREDIT' ? (
        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold text-[10px]">
          <ArrowDownLeft className="w-3 h-3" /> CREDIT
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold text-[10px]">
          <ArrowUpRight className="w-3 h-3" /> DEBIT
        </span>
      ),
  },
  { key: 'account', header: 'Account ID', className: 'font-mono text-slate-400' },
  {
    key: 'amount',
    header: 'Amount',
    className: 'font-extrabold text-white text-sm',
    render: (entry) => `${entry.type === 'CREDIT' ? '+' : '-'} ${formatCurrency(entry.amount)}`,
  },
  { key: 'transaction', header: 'Transaction Ref', className: 'font-mono text-slate-400', render: (entry) => entry.transaction || 'N/A' },
  { key: 'createdAt', header: 'Timestamp', className: 'text-slate-400', render: (entry) => formatDateTime(getCreatedAt(entry)) },
];

export const LedgerTable = ({ entries = [], loading = false, error = null, onRetry }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const query = search.toLowerCase();
  const filteredEntries = entries.filter((item) => {
    const matchesSearch = [item.account, item.transaction, item._id].some((value) =>
      (value || '').toLowerCase().includes(query)
    );

    return matchesSearch && (filterType === 'ALL' || item.type === filterType);
  });

  return (
    <Card>
      <CardHeader
        className="mb-5"
        title="Ledger Audit Log"
        subtitle="Immutable credit & debit records for your accounts"
        actions={
          <>
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Ledger ID / Txn..."
                aria-label="Search ledger entries"
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterType(f.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-medium transition-all',
                    filterType === f.value ? f.active : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={filteredEntries}
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyTitle={entries.length === 0 ? 'No ledger entries yet' : 'No entries match your filters'}
        emptyDescription={entries.length === 0 ? 'Credits and debits will appear here after your first transfer.' : undefined}
      />
    </Card>
  );
};
