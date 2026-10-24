import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ReviewTransferModal } from '../components/admin/ReviewTransferModal';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { useApprovals } from '../hooks/queries';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatCurrency, formatDateTime, getCreatedAt, shortId } from '../utils/format';

const idCell = (id) => <span title={id}>{shortId(id)}</span>;

const buildColumns = (onReview) => [
  { key: 'createdAt', header: 'Requested', className: 'text-muted whitespace-nowrap', render: (t) => formatDateTime(getCreatedAt(t)) },
  {
    key: 'requestedBy',
    header: 'Customer',
    render: (t) => (
      <div>
        <div className="font-semibold text-fg">{t.requestedBy?.name ?? '—'}</div>
        <div className="text-xs text-subtle">{t.requestedBy?.email}</div>
      </div>
    ),
  },
  { key: 'fromAccount', header: 'From', className: 'font-mono text-[13px] text-muted', render: (t) => idCell(t.fromAccount) },
  { key: 'toAccount', header: 'To', className: 'font-mono text-[13px] text-muted', render: (t) => idCell(t.toAccount) },
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
    render: (t) => (
      <div className="flex justify-end gap-2">
        <Button size="sm" icon={CheckCircle2} onClick={() => onReview({ transaction: t, decision: 'approve' })}>
          Approve
        </Button>
        <Button size="sm" variant="danger" icon={XCircle} onClick={() => onReview({ transaction: t, decision: 'reject' })}>
          Reject
        </Button>
      </div>
    ),
  },
];

export const AdminApprovals = () => {
  useDocumentTitle('Approvals');
  const { data: transactions = [], isLoading, error, refetch } = useApprovals();
  const [review, setReview] = useState(null);

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Transfers above the approval threshold wait here. Approving runs the transfer; rejecting cancels it with a reason the customer can see."
      />

      <Card className="p-0">
        <CardHeader
          divided
          title="Waiting for approval"
          subtitle={
            transactions.length
              ? `${transactions.length} ${transactions.length === 1 ? 'transfer' : 'transfers'} · ${formatCurrency(total)} in total, oldest first`
              : 'Oldest first'
          }
        />
        <DataTable
          columns={buildColumns(setReview)}
          rows={transactions}
          loading={isLoading}
          error={error?.message}
          onRetry={() => refetch()}
          emptyTitle="Nothing waiting for approval"
          emptyDescription="Transfers above the approval threshold will appear here."
          minWidth={860}
        />
      </Card>

      <ReviewTransferModal review={review} onClose={() => setReview(null)} />
    </>
  );
};
