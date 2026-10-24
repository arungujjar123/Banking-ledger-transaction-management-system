import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { generateIdempotencyKey } from '../../services/api';
import { useDisburseFunds } from '../../hooks/queries';
import { useToast } from '../../context/ToastContext';
import { accountLabel, parseRupeesToPaise } from '../../utils/format';

export const InitialFundsModal = ({ isOpen, onClose, targetUser }) => {
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('10000');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const { showSuccess, showError } = useToast();
  const disburse = useDisburseFunds();

  const targetAccounts = targetUser?.accounts ?? [];

  // A new key each time the modal opens; retries inside one session reuse it, so a
  // timed-out request cannot fund the account twice
  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateIdempotencyKey());
      setToAccount(targetUser?.accounts?.[0]?._id ?? '');
    }
  }, [isOpen, targetUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const paise = parseRupeesToPaise(amount);
    if (!toAccount || !paise) {
      showError('Enter a destination account and an amount greater than 0 with at most 2 decimal places');
      return;
    }

    try {
      const res = await disburse.mutateAsync({
        toAccount,
        amount: paise,
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
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.trim())}
          placeholder="0.00"
          className="tabular-nums"
          required
        />

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
