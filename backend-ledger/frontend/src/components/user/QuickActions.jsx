import React from 'react';
import { PlusCircle, ArrowLeftRight, CreditCard, ShieldCheck } from 'lucide-react';

export const QuickActions = ({ onCreateAccount, onOpenTransfer }) => {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
        Quick Operations
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onOpenTransfer}
          className="p-4 rounded-xl bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 text-left transition-all duration-200 group flex items-start gap-3"
        >
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-white block group-hover:text-emerald-300 transition-colors">
              Transfer Funds
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Send money via double-entry ledger with idempotency
            </span>
          </div>
        </button>

        <button
          onClick={onCreateAccount}
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-left transition-all duration-200 group flex items-start gap-3"
        >
          <div className="p-2.5 rounded-lg bg-slate-800 text-emerald-400 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-white block group-hover:text-emerald-300 transition-colors">
              Create New Account
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Instantly provision a new financial account ID
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
