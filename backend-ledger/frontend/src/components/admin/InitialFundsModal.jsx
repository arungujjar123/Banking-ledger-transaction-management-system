import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { transactionService, generateIdempotencyKey } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { DollarSign, ShieldAlert, RefreshCw, Send } from 'lucide-react';

export const InitialFundsModal = ({ isOpen, onClose, targetUser, onSuccess }) => {
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('10000');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateIdempotencyKey());
      if (targetUser?.accounts && targetUser.accounts.length > 0) {
        setToAccount(targetUser.accounts[0]._id);
      } else if (targetUser?._id) {
        setToAccount('');
      }
    }
  }, [isOpen, targetUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toAccount || !amount || Number(amount) <= 0) {
      showError('Please provide a valid destination account ID and amount');
      return;
    }

    setLoading(true);
    try {
      const res = await transactionService.createInitialFunds({
        toAccount,
        amount: Number(amount),
        idempotencyKey,
      });

      showSuccess(res.message || 'Initial funds disbursed successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to disburse initial funds. Make sure system user has an account.');
    } finally {
      setLoading(false);
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
            <span className="font-bold text-emerald-300">{targetUser?.name || 'Selected User'}</span>'s account via double-entry ledger.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Account</label>
          {targetUser?.accounts && targetUser.accounts.length > 0 ? (
            <select
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              required
            >
              {targetUser.accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  Account {acc._id} ({acc.status})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              placeholder="Enter Account ID (e.g. 65e31a890123...)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              required
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Amount (INR)</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-semibold">₹</span>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
              required
            />
          </div>
        </div>

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
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow-emerald transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Disburse Funds
          </button>
        </div>
      </form>
    </Modal>
  );
};
