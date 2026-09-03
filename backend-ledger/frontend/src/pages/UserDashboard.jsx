import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { StatCard } from '../components/common/StatCard';
import { AccountCard } from '../components/user/AccountCard';
import { LedgerTable } from '../components/user/LedgerTable';
import { QuickActions } from '../components/user/QuickActions';
import { TransferModal } from '../components/user/TransferModal';
import { accountService, adminService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, RefreshCw } from 'lucide-react';

export const UserDashboard = () => {
  const { user, role } = useAuth();
  const { showSuccess, showError } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedFromAccount, setSelectedFromAccount] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const userAccounts = await accountService.getUserAccounts();
      setAccounts(userAccounts);

      const userLedger = role === 'admin' 
        ? await adminService.getAllLedgerEntries()
        : await accountService.getUserLedger();
        
      setLedgerEntries(userLedger);
    } catch (err) {
      console.warn('Dashboard fetch issue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [role]);

  const handleCreateAccount = async () => {
    try {
      await accountService.createAccount();
      showSuccess('New account provisioned successfully!');
      loadDashboardData();
    } catch (err) {
      showError(err.message || 'Failed to create account');
    }
  };

  const handleOpenTransfer = (accId = '') => {
    setSelectedFromAccount(accId);
    setIsTransferOpen(true);
  };

  const totalAccounts = accounts.length;
  const creditEntries = ledgerEntries.filter((e) => e.type === 'CREDIT');
  const debitEntries = ledgerEntries.filter((e) => e.type === 'DEBIT');

  const totalCredits = creditEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalDebits = debitEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Welcome back, <span className="text-emerald-400">{user?.name || 'User'}</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Here is your live double-entry financial ledger overview.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadDashboardData}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>

              <button
                onClick={handleCreateAccount}
                className="px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-glow-emerald"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                New Account
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Active Accounts"
              value={totalAccounts.toString()}
              subtitle="Provisioned accounts"
              icon={Wallet}
            />
            <StatCard
              title="Total Ledger Credits"
              value={`₹${totalCredits.toLocaleString('en-IN')}`}
              subtitle="Incoming credit volume"
              icon={ArrowDownLeft}
            />
            <StatCard
              title="Total Ledger Debits"
              value={`₹${totalDebits.toLocaleString('en-IN')}`}
              subtitle="Outgoing debit volume"
              icon={ArrowUpRight}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Your Financial Accounts</h2>
              <span className="text-xs text-slate-400">{accounts.length} active</span>
            </div>

            {accounts.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center">
                <p className="text-slate-400 text-sm mb-3">No accounts provisioned yet.</p>
                <button
                  onClick={handleCreateAccount}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Create First Account
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((acc) => (
                  <AccountCard
                    key={acc._id}
                    account={acc}
                    onSelectForTransfer={handleOpenTransfer}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <QuickActions
                onCreateAccount={handleCreateAccount}
                onOpenTransfer={() => handleOpenTransfer()}
              />
            </div>
            <div className="lg:col-span-2">
              <LedgerTable entries={ledgerEntries} />
            </div>
          </div>
        </main>
      </div>

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        userAccounts={accounts}
        defaultFromAccount={selectedFromAccount}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};
