import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { transactionService, generateIdempotencyKey } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ArrowRightLeft, ShieldCheck, RefreshCw, Send } from 'lucide-react';

export const TransferModal = ({ isOpen, onClose, userAccounts = [], defaultFromAccount = '', onSuccess }) => {
  const [fromAccount, setFromAccount] = useState(defaultFromAccount);
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

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

  const handleRegenerateKey = () => {
    setIdempotencyKey(generateIdempotencyKey());
  };

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

    setLoading(true);
    try {
      const res = await transactionService.createTransaction({
        fromAccount,
        toAccount,
        amount: Number(amount),
        idempotencyKey,
      });

      showSuccess(res.message || 'Transaction executed successfully!');
      if (onSuccess) onSuccess();
      onClose();
      // Reset fields
      setToAccount('');
      setAmount('');
    } catch (err) {
      showError(err.message || 'Transaction failed. Please verify account balance and details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Double-Entry Transfer">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* From Account Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">From Account (Source)</label>
          <select
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            required
          >
            {userAccounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                Account {acc._id} ({acc.status})
              </option>
            ))}
          </select>
        </div>

        {/* To Account Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">To Account (Destination ID)</label>
          <input
            type="text"
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            placeholder="e.g. 65e31a890123ef0011a002"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            required
          />
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (INR)</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-semibold">₹</span>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
              required
            />
          </div>
        </div>

        {/* Idempotency Key View & Regenerate */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-500/20 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Idempotency Protection
            </span>
            <button
              type="button"
              onClick={handleRegenerateKey}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh Key
            </button>
          </div>
          <p className="font-mono text-[11px] text-slate-300 truncate">{idempotencyKey}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-slate-950 font-bold text-xs shadow-glow-emerald transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Execute Transfer</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
