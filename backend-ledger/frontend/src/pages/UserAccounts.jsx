import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { AccountCard } from '../components/user/AccountCard';
import { TransferModal } from '../components/user/TransferModal';
import { EmptyState, ErrorState, LoadingCards } from '../components/common/States';
import { accountService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CreditCard, Plus, RefreshCw } from 'lucide-react';

export const UserAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedFromAccount, setSelectedFromAccount] = useState('');
  const { showSuccess, showError } = useToast();

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountService.getUserAccounts();
      setAccounts(data);
    } catch (e) {
      setError(e.message || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async () => {
    try {
      await accountService.createAccount();
      showSuccess('Account provisioned successfully');
      fetchAccounts();
    } catch (e) {
      showError(e.message || 'Error creating account');
    }
  };

  const handleOpenTransfer = (accId = '') => {
    setSelectedFromAccount(accId);
    setIsTransferOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-emerald-400" />
                Accounts & Balances
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Manage your financial accounts and view real-time double-entry balances
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchAccounts}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
              <button
                onClick={handleCreateAccount}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-glow-emerald transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Provision New Account
              </button>
            </div>
          </div>

          {error ? (
            <div className="glass-panel rounded-2xl">
              <ErrorState message={error} onRetry={fetchAccounts} />
            </div>
          ) : !loading && accounts.length === 0 ? (
            <div className="glass-panel rounded-2xl">
              <EmptyState
                title="No accounts yet"
                description="Create your first account to start receiving and sending funds."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {loading && accounts.length === 0 ? (
                <LoadingCards count={3} />
              ) : (
                accounts.map((acc) => (
                  <AccountCard
                    key={acc._id}
                    account={acc}
                    onSelectForTransfer={handleOpenTransfer}
                  />
                ))
              )}
            </div>
          )}
        </main>
      </div>

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        userAccounts={accounts}
        defaultFromAccount={selectedFromAccount}
        onSuccess={fetchAccounts}
      />
    </div>
  );
};
