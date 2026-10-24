import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { useReviewTransfer } from '../../hooks/queries';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, shortId } from '../../utils/format';

const SummaryRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-t border-border first:border-t-0">
    <span className="text-muted">{label}</span>
    <span className="text-right text-fg">{children}</span>
  </div>
);

const MIN_REASON = 3;

// `review` is { transaction, decision: 'approve' | 'reject' } or null when closed
export const ReviewTransferModal = ({ review, onClose }) => {
  const [reason, setReason] = useState('');
  const { showSuccess, showError } = useToast();
  const mutation = useReviewTransfer();

  useEffect(() => {
    if (review) setReason('');
  }, [review]);

  const transaction = review?.transaction;
  const approving = review?.decision === 'approve';
  const trimmed = reason.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!approving && trimmed.length < MIN_REASON) return;

    try {
      await mutation.mutateAsync({ transactionId: transaction._id, decision: review.decision, reason: trimmed });
      showSuccess(
        approving
          ? `${formatCurrency(transaction.amount)} sent to ${shortId(transaction.toAccount)}`
          : 'Transfer rejected. No money was moved.'
      );
      onClose();
    } catch (err) {
      showError(err.message || 'Could not review the transfer. Nothing was changed.');
    }
  };

  return (
    <Modal isOpen={Boolean(review)} onClose={onClose} title={approving ? 'Approve transfer' : 'Reject transfer'}>
      {transaction && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-muted leading-relaxed">
            {approving
              ? 'The transfer runs now, with the same balance and account checks as any transfer.'
              : 'The transfer is cancelled and no money moves. The customer sees your reason.'}
          </p>

          <div className="rounded-control border border-border px-4">
            <SummaryRow label="Amount">
              <span className="font-semibold tabular-nums">{formatCurrency(transaction.amount)}</span>
            </SummaryRow>
            <SummaryRow label="Requested by">
              {transaction.requestedBy?.name ?? '—'}
              {transaction.requestedBy?.email && (
                <span className="block text-xs text-subtle mt-0.5">{transaction.requestedBy.email}</span>
              )}
            </SummaryRow>
            <SummaryRow label="From">
              <span className="font-mono text-[13px]" title={transaction.fromAccount}>{shortId(transaction.fromAccount)}</span>
            </SummaryRow>
            <SummaryRow label="To">
              <span className="font-mono text-[13px]" title={transaction.toAccount}>{shortId(transaction.toAccount)}</span>
            </SummaryRow>
          </div>

          {!approving && (
            <Textarea
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Could not verify the recipient"
              maxLength={500}
              required
            />
          )}

          <div className="flex items-center justify-end gap-2.5">
            <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={approving ? 'primary' : 'danger'}
              icon={approving ? CheckCircle2 : XCircle}
              disabled={!approving && trimmed.length < MIN_REASON}
              loading={mutation.isPending}
              loadingText={approving ? 'Approving...' : 'Rejecting...'}
            >
              {approving ? 'Approve and send' : 'Reject transfer'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
