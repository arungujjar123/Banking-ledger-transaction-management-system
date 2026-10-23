import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { LedgerTable } from '../components/user/LedgerTable';
import { TransferModal } from '../components/user/TransferModal';
import { accountService } from '../services/api';
import { ArrowLeftRight, Plus } from 'lucide-react';

export const UserTransactions = () => {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [userAccounts, setUserAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [entries, accs] = await Promise.all([
        accountService.getUserLedger(),
        accountService.getUserAccounts(),
      ]);
      setLedgerEntries(entries);
      setUserAccounts(accs);
    } catch (e) {
      setError(e.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <ArrowLeftRight className="w-6 h-6 text-emerald-400" />
                Transactions & Double-Entry Ledger
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Audit history of all credits, debits, and fund transfers from MongoDB
              </p>
            </div>

            <button
              onClick={() => setIsTransferOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow-emerald transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Transfer
            </button>
          </div>

          <LedgerTable entries={ledgerEntries} loading={loading} error={error} onRetry={loadData} />
        </main>
      </div>

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        userAccounts={userAccounts}
        onSuccess={loadData}
      />
    </div>
  );
};
