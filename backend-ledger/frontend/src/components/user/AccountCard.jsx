import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/Button';
import { Copy, Check, Wallet, RefreshCw } from 'lucide-react';
import { useAccountBalance } from '../../hooks/queries';
import { formatAmount } from '../../utils/format';

export const AccountCard = ({ account, onSelectForTransfer }) => {
  const [copied, setCopied] = useState(false);
  const { data: balance, isFetching, refetch } = useAccountBalance(account._id);

  const copyId = () => {
    navigator.clipboard.writeText(account._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
      {/* Decorative Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Account ID
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-mono font-medium text-emerald-300">
                  {account._id}
                </span>
                <button
                  onClick={copyId}
                  className="text-slate-500 hover:text-emerald-400 transition-colors p-0.5"
                  aria-label="Copy account ID"
                  title="Copy Account ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <StatusBadge status={account.status || 'ACTIVE'} />
        </div>

        {/* Balance Display */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Derived Ledger Balance</span>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="hover:text-emerald-400 transition-colors p-1"
              aria-label="Refresh balance"
              title="Refresh Balance"
            >
              <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-1.5">
            <span className="text-emerald-400 text-xl">₹</span>
            {isFetching ? (
              <span className="text-slate-500 text-lg animate-pulse">Calculating...</span>
            ) : (
              <span>{formatAmount(balance)}</span>
            )}
            <span className="text-xs font-normal text-slate-400">{account.currency || 'INR'}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {onSelectForTransfer && (
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-end">
          <Button variant="secondary" fullWidth onClick={() => onSelectForTransfer(account._id)}>
            Transfer Funds from this Account
          </Button>
        </div>
      )}
    </div>
  );
};
