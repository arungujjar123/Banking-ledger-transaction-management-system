import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { UserApprovalTable } from '../components/admin/UserApprovalTable';
import { InitialFundsModal } from '../components/admin/InitialFundsModal';
import { adminService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Users } from 'lucide-react';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [targetUser, setTargetUser] = useState(null);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const { showSuccess, showError } = useToast();

  const loadUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (e) {
      showError('Failed to load users');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      showSuccess(`Status changed to ${newStatus}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (e) {
      showError('Failed to update status');
    }
  };

  const handleOpenFundModal = (user) => {
    setTargetUser(user);
    setIsFundModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              User Account Approvals & Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Approve, freeze, or disburse initial reserve funds to registered user accounts
            </p>
          </div>

          <UserApprovalTable
            users={users}
            onUpdateStatus={handleUpdateStatus}
            onDisburseInitialFunds={handleOpenFundModal}
          />
        </main>
      </div>

      <InitialFundsModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        targetUser={targetUser}
        onSuccess={loadUsers}
      />
    </div>
  );
};
