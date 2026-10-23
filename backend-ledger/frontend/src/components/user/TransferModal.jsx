import React, { useState, useEffect } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { generateIdempotencyKey } from '../../services/api';
import { useCreateTransfer } from '../../hooks/queries';
import { useToast } from '../../context/ToastContext';
import { accountLabel } from '../../utils/format';

export const TransferModal = ({ isOpen, onClose, userAccounts = [], defaultFromAccount = '' }) => {
  const [fromAccount, setFromAccount] = useState(defaultFromAccount);
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const { showSuccess, showError } = useToast();
  const transfer = useCreateTransfer();

  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateIdempotencyKey());
      if (defaultFromAccount) {
        setFromAccount(defaultFromAccount);
      } else if (userAccounts.length > 0) {
        setFromAccount(userAccounts[0]._id);
      }
    }
  }, [isOpen, defaultFromAccount, userAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromAccount || !toAccount || !amount || Number(amount) <= 0) {
      showError('Please fill in all fields with a valid amount');
      return;
    }

    if (fromAccount === toAccount) {
      showError('Sender and Receiver accounts cannot be the same');
      return;
    }

    try {
      const res = await transfer.mutateAsync({
        fromAccount,
        toAccount,
        amount: Number(amount),
        idempotencyKey,
      });

      showSuccess(res.message || 'Transaction executed successfully!');
      onClose();
      setToAccount('');
      setAmount('');
    } catch (err) {
      showError(err.message || 'Transaction failed. Please verify account balance and details.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer funds">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="From account" value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} required>
          {userAccounts.map((acc) => (
            <option key={acc._id} value={acc._id}>
              {accountLabel(acc._id)} ({acc.status.toLowerCase()})
            </option>
          ))}
        </Select>

        <Input
          label="To account ID"
          value={toAccount}
          onChange={(e) => setToAccount(e.target.value)}
          placeholder="24-character account ID"
          mono
          required
        />

        <Input
          label="Amount"
          prefix="₹"
          type="number"
          min="1"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
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
          <Button type="submit" icon={Send} loading={transfer.isPending} loadingText="Sending...">
            Send transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
};
