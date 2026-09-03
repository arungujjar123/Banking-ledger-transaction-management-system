import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { StatCard } from '../components/common/StatCard';
import { UserApprovalTable } from '../components/admin/UserApprovalTable';
import { BlockedTokensTable } from '../components/admin/BlockedTokensTable';
import { InitialFundsModal } from '../components/admin/InitialFundsModal';
import { adminService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, Users, BookOpenCheck, ShieldAlert, DollarSign } from 'lucide-react';

export const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [blockedTokens, setBlockedTokens] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [targetFundUser, setTargetFundUser] = useState(null);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const { showSuccess, showError } = useToast();

  const loadAdminData = async () => {
    try {
      const uList = await adminService.getAllUsers();
      setUsers(uList);

      const lEntries = await adminService.getAllLedgerEntries();
      setLedgerEntries(lEntries);

      const bTokens = await adminService.getBlockedTokens();
      setBlockedTokens(bTokens);

      const txns = await adminService.getAllTransactions();
      setTransactions(txns);
    } catch (e) {
      console.warn('Admin load error', e);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      showSuccess(`Account status updated to ${newStatus}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (e) {
      showError('Failed to update status');
    }
  };

  const handleOpenDisburseModal = (user) => {
    setTargetFundUser(user);
    setIsFundModalOpen(true);
  };

  const totalVolume = ledgerEntries.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Admin Header */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4" /> Admin Command Center
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              System Administration & Ledger Control
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Approve user accounts, inspect system-wide ledger entries, monitor blocked tokens, and disburse initial funds.
            </p>
          </div>

          {/* Admin KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Registered Users"
              value={users.length.toString()}
              subtitle="Accounts in system"
              icon={Users}
            />
            <StatCard
              title="Total Ledger Entries"
              value={ledgerEntries.length.toString()}
              subtitle="Credit/Debit entries"
              icon={BookOpenCheck}
            />
            <StatCard
              title="Total System Volume"
              value={`₹${totalVolume.toLocaleString('en-IN')}`}
              subtitle="Processed volume"
              icon={DollarSign}
            />
            <StatCard
              title="Blocked Tokens"
              value={blockedTokens.length.toString()}
              subtitle="Revoked JWTs"
              icon={ShieldAlert}
            />
          </div>

          {/* User Approvals Table */}
          <UserApprovalTable
            users={users}
            onUpdateStatus={handleUpdateStatus}
            onDisburseInitialFunds={handleOpenDisburseModal}
          />

          {/* Security & Blocked Tokens Table */}
          <BlockedTokensTable tokens={blockedTokens} />
        </main>
      </div>

      <InitialFundsModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        targetUser={targetFundUser}
        onSuccess={loadAdminData}
      />
    </div>
  );
};
