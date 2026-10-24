import React, { useEffect, useState } from 'react';
import { Undo2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { generateIdempotencyKey } from '../../services/api';
import { useReverseTransaction } from '../../hooks/queries';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, shortId } from '../../utils/format';

const SummaryRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-t border-border first:border-t-0">
    <span className="text-muted">{label}</span>
    <span className="text-right text-fg">{children}</span>
  </div>
);

const MIN_REASON = 3;

export const ReverseTransactionModal = ({ transaction, onClose }) => {
  const [reason, setReason] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const { showSuccess, showError } = useToast();
  const reverse = useReverseTransaction();

  // A new key per opened transaction; retries while the modal is open reuse it, so a
  // timed-out request can never move the money back twice
  useEffect(() => {
    if (transaction) {
      setReason('');
      setIdempotencyKey(generateIdempotencyKey());
    }
  }, [transaction]);

  const trimmed = reason.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (trimmed.length < MIN_REASON) return;

    try {
      await reverse.mutateAsync({ transactionId: transaction._id, reason: trimmed, idempotencyKey });
      showSuccess(`${formatCurrency(transaction.amount)} moved back to ${shortId(transaction.fromAccount)}`);
      onClose();
    } catch (err) {
      showError(err.message || 'Reversal failed. No money was moved.');
    }
  };

  return (
    <Modal isOpen={Boolean(transaction)} onClose={onClose} title="Reverse transfer">
      {transaction && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-muted leading-relaxed">
            Writes a new, opposite transfer and marks this one as reversed. The original ledger entries stay as they are.
          </p>

          <div className="rounded-control border border-border px-4">
            <SummaryRow label="Amount">
              <span className="font-semibold tabular-nums">{formatCurrency(transaction.amount)}</span>
            </SummaryRow>
            <SummaryRow label="Taken back from">
              <span className="font-mono text-[13px]" title={transaction.toAccount}>{shortId(transaction.toAccount)}</span>
            </SummaryRow>
            <SummaryRow label="Returned to">
              <span className="font-mono text-[13px]" title={transaction.fromAccount}>{shortId(transaction.fromAccount)}</span>
            </SummaryRow>
            <SummaryRow label="Original transaction">
              <span className="font-mono text-xs">{transaction._id}</span>
            </SummaryRow>
          </div>

          <Textarea
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Sent to the wrong account by mistake"
            maxLength={500}
            required
          />

          <div className="flex items-center justify-end gap-2.5">
            <Button variant="ghost" onClick={onClose} disabled={reverse.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              icon={Undo2}
              disabled={trimmed.length < MIN_REASON}
              loading={reverse.isPending}
              loadingText="Reversing..."
            >
              Reverse transfer
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
