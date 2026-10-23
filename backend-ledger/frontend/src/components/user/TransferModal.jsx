import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { generateIdempotencyKey } from '../../services/api';
import { useCreateTransfer } from '../../hooks/queries';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, RefreshCw, Send } from 'lucide-react';

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
    <Modal isOpen={isOpen} onClose={onClose} title="New Double-Entry Transfer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="From Account (Source)"
          value={fromAccount}
          onChange={(e) => setFromAccount(e.target.value)}
          required
        >
          {userAccounts.map((acc) => (
            <option key={acc._id} value={acc._id}>
              Account {acc._id} ({acc.status})
            </option>
          ))}
        </Select>

        <Input
          label="To Account (Destination ID)"
          value={toAccount}
          onChange={(e) => setToAccount(e.target.value)}
          placeholder="e.g. 65e31a890123ef0011a002"
          mono
          required
        />

        <Input
          label="Amount (INR)"
          prefix="₹"
          type="number"
          min="1"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="font-bold"
          required
        />

        {/* Idempotency Key View & Regenerate */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Idempotency Protection
            </span>
            <button
              type="button"
              onClick={() => setIdempotencyKey(generateIdempotencyKey())}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh Key
            </button>
          </div>
          <p className="font-mono text-[11px] text-slate-300 truncate">{idempotencyKey}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={Send} loading={transfer.isPending} loadingText="Processing..." className="px-5 py-2.5 font-bold">
            Execute Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
};
