import React from 'react';
import { Card, CardHeader } from '../ui/Card';
import { StatusBadge } from '../common/StatusBadge';
import { useMyApprovalRequests } from '../../hooks/queries';
import { formatCurrency, formatDateTime, getCreatedAt, shortId } from '../../utils/format';

// Large transfers that wait for an admin, and recently rejected ones with the admin's reason.
// Hidden when there are none.
export const ApprovalRequests = () => {
  const { data: requests = [] } = useMyApprovalRequests();

  if (requests.length === 0) return null;

  return (
    <Card className="p-0">
      <CardHeader
        divided
        title="Approval requests"
        subtitle="Large transfers move only after an admin approves them."
      />
      <ul className="divide-y divide-border">
        {requests.map((t) => (
          <li key={t._id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-3.5">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-fg tabular-nums">
                {formatCurrency(t.amount)}{' '}
                <span className="font-normal text-muted">
                  to <span className="font-mono text-[13px] text-fg" title={t.toAccount}>{shortId(t.toAccount)}</span>
                </span>
              </div>
              <div className="text-xs text-subtle mt-0.5">
                Requested {formatDateTime(getCreatedAt(t))} from <span className="font-mono">{shortId(t.fromAccount)}</span>
              </div>
              {t.rejectionReason && <p className="text-[13px] text-debit mt-1">Reason: {t.rejectionReason}</p>}
            </div>
            <StatusBadge status={t.status} />
          </li>
        ))}
      </ul>
    </Card>
  );
};
