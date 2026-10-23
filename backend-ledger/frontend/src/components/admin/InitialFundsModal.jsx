import React, { useState, useEffect } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { generateIdempotencyKey } from '../../services/api';
import { useDisburseFunds } from '../../hooks/queries';
import { useToast } from '../../context/ToastContext';
import { accountLabel } from '../../utils/format';

export const InitialFundsModal = ({ isOpen, onClose, targetUser }) => {
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('10000');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const { showSuccess, showError } = useToast();
  const disburse = useDisburseFunds();

  const targetAccounts = targetUser?.accounts ?? [];

  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateIdempotencyKey());
      setToAccount(targetUser?.accounts?.[0]?._id ?? '');
    }
  }, [isOpen, targetUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toAccount || !amount || Number(amount) <= 0) {
      showError('Please provide a valid destination account ID and amount');
      return;
    }

    try {
      const res = await disburse.mutateAsync({
        toAccount,
        amount: Number(amount),
        idempotencyKey,
      });

      showSuccess(res.message || 'Initial funds disbursed successfully!');
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to disburse initial funds. Make sure system user has an account.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add initial funds">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-muted leading-relaxed">
          Moves money from the system reserve account to{' '}
          <span className="font-semibold text-fg">{targetUser?.name || 'the selected user'}</span>. It is recorded as a normal debit and credit in the ledger.
        </p>

        {targetAccounts.length > 0 ? (
          <Select label="Destination account" value={toAccount} onChange={(e) => setToAccount(e.target.value)} required>
            {targetAccounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {accountLabel(acc._id)} ({acc.status.toLowerCase()})
              </option>
            ))}
          </Select>
        ) : (
          <Input
            label="Destination account ID"
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            placeholder="24-character account ID"
            mono
            required
          />
        )}

        <Input
          label="Amount"
          prefix="₹"
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="tabular-nums"
          required
        />

        <div className="rounded-control border border-border bg-surface-2 p-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-muted">Idempotency key</span>
            <button
              type="button"
              onClick={() => setIdempotencyKey(generateIdempotencyKey())}
              className="flex items-center gap-1 text-muted hover:text-fg transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> New key
            </button>
          </div>
          <p className="font-mono text-xs text-subtle truncate mt-1">{idempotencyKey}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={Send} loading={disburse.isPending} loadingText="Adding...">
            Add funds
          </Button>
        </div>
      </form>
    </Modal>
  );
};
