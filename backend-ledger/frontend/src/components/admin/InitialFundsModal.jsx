import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { generateIdempotencyKey } from '../../services/api';
import { useDisburseFunds } from '../../hooks/queries';
import { useToast } from '../../context/ToastContext';
import { DollarSign, RefreshCw, Send } from 'lucide-react';

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
    <Modal isOpen={isOpen} onClose={onClose} title="Disburse System Initial Funds">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-500/30 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-bold mb-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            System Reserve Transfer
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            This operation transfers initial capital from the System Reserve account to{' '}
            <span className="font-bold text-emerald-300">{targetUser?.name || 'Selected User'}</span>&apos;s account via double-entry ledger.
          </p>
        </div>

        {targetAccounts.length > 0 ? (
          <Select label="Destination Account" value={toAccount} onChange={(e) => setToAccount(e.target.value)} mono required>
            {targetAccounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                Account {acc._id} ({acc.status})
              </option>
            ))}
          </Select>
        ) : (
          <Input
            label="Destination Account"
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            placeholder="Enter Account ID (e.g. 65e31a890123...)"
            mono
            required
          />
        )}

        <Input
          label="Initial Amount (INR)"
          prefix="₹"
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="font-bold"
          required
        />

        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-emerald-400">Idempotency Key</span>
            <button
              type="button"
              onClick={() => setIdempotencyKey(generateIdempotencyKey())}
              className="text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <p className="font-mono text-[11px] text-slate-300 truncate">{idempotencyKey}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="solid" icon={Send} loading={disburse.isPending} className="px-5 py-2.5">
            Disburse Funds
          </Button>
        </div>
      </form>
    </Modal>
  );
};
