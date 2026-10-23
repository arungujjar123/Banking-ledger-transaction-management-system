import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { DataTable } from '../ui/DataTable';
import { SearchInput } from '../ui/SearchInput';
import { EmptyState, ErrorState } from '../ui/States';
import { Badge } from '../common/StatusBadge';
import { cn } from '../../utils/cn';
import { formatCurrency, formatDateTime, getCreatedAt, shortId } from '../../utils/format';

const filters = [
  { value: 'ALL', label: 'All' },
  { value: 'CREDIT', label: 'Credits' },
  { value: 'DEBIT', label: 'Debits' },
];

const TypeIcon = ({ type, className }) =>
  type === 'CREDIT'
    ? <ArrowDownLeft className={className} strokeWidth={2.5} aria-hidden="true" />
    : <ArrowUpRight className={className} strokeWidth={2.5} aria-hidden="true" />;

const SignedAmount = ({ entry }) => (
  <span className={cn('font-semibold tabular-nums whitespace-nowrap', entry.type === 'CREDIT' ? 'text-accent' : 'text-fg')}>
    {entry.type === 'CREDIT' ? '+ ' : '− '}
    {formatCurrency(entry.amount)}
  </span>
);

const columns = [
  { key: 'date', header: 'Date', className: 'text-muted whitespace-nowrap', render: (e) => formatDateTime(getCreatedAt(e)) },
  {
    key: 'type',
    header: 'Type',
    render: (e) => (
      <Badge tone={e.type === 'CREDIT' ? 'success' : 'danger'}>
        <TypeIcon type={e.type} className="w-3.5 h-3.5" /> {e.type === 'CREDIT' ? 'Credit' : 'Debit'}
      </Badge>
    ),
  },
  {
    key: 'account',
    header: 'Account',
    className: 'font-mono text-[13px] text-muted',
    render: (e) => <span title={e.account}>{shortId(e.account)}</span>,
  },
  {
    key: 'transaction',
    header: 'Transaction',
    className: 'font-mono text-[13px] text-muted',
    render: (e) => <span title={e.transaction}>{shortId(e.transaction)}</span>,
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    render: (e) => <SignedAmount entry={e} />,
  },
];

// Phones get a compact list instead of a sideways-scrolling table
const MobileEntryList = ({ entries, loading, error, onRetry, emptyTitle, emptyDescription }) => {
  if (loading && entries.length === 0) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-9 w-9 rounded-control bg-surface-2 dark:bg-border animate-pulse" />
            <div className="flex-1 h-3 rounded bg-surface-2 dark:bg-border animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (entries.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <ul className="divide-y divide-border">
      {entries.map((e) => (
        <li key={e._id} className="flex items-center gap-3 px-4 py-3.5">
          <span
            className={cn(
              'h-9 w-9 shrink-0 rounded-control flex items-center justify-center',
              e.type === 'CREDIT' ? 'bg-accent-soft text-accent-fg' : 'bg-debit-soft text-debit'
            )}
          >
            <TypeIcon type={e.type} className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-fg">
              {e.type === 'CREDIT' ? 'Credit' : 'Debit'} · <span className="font-mono text-[13px] font-medium">{shortId(e.account)}</span>
            </div>
            <div className="text-xs text-subtle mt-0.5">{formatDateTime(getCreatedAt(e))}</div>
          </div>
          <SignedAmount entry={e} />
        </li>
      ))}
    </ul>
  );
};

export const LedgerTable = ({
  entries = [],
  loading = false,
  error = null,
  onRetry,
  title = 'Ledger activity',
  subtitle = 'Every transfer writes one debit and one credit entry. Entries can never be edited.',
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const query = search.toLowerCase();
  const filteredEntries = entries.filter((item) => {
    const matchesSearch = [item.account, item.transaction, item._id].some((value) =>
      (value || '').toLowerCase().includes(query)
    );

    return matchesSearch && (filterType === 'ALL' || item.type === filterType);
  });

  const emptyProps = {
    emptyTitle: entries.length === 0 ? 'No ledger entries yet' : 'No entries match your filters',
    emptyDescription: entries.length === 0 ? 'Credits and debits will appear here after your first transfer.' : undefined,
  };

  return (
    <Card className="p-0">
      <CardHeader
        divided
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <SearchInput
              label="Search by account or transaction ID"
              placeholder="Search entries"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-52"
            />

            <div role="group" aria-label="Filter by entry type" className="flex p-[3px] rounded-control bg-surface-2 border border-border">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterType(f.value)}
                  aria-pressed={filterType === f.value}
                  className={cn(
                    'px-3 h-[30px] rounded-lg text-sm transition-colors',
                    filterType === f.value ? 'bg-surface text-fg font-semibold shadow-card dark:bg-border' : 'text-muted hover:text-fg'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        }
      />

      <div className="hidden sm:block">
        <DataTable columns={columns} rows={filteredEntries} loading={loading} error={error} onRetry={onRetry} {...emptyProps} />
      </div>
      <div className="sm:hidden">
        <MobileEntryList entries={filteredEntries} loading={loading} error={error} onRetry={onRetry} {...emptyProps} />
      </div>
    </Card>
  );
};
