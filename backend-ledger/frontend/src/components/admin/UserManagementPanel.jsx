import React, { useState } from 'react';
import { UserApprovalTable } from './UserApprovalTable';
import { InitialFundsModal } from './InitialFundsModal';
import { useAdminUsers, useUpdateUserStatus } from '../../hooks/queries';
import { useToast } from '../../context/ToastContext';

// User table plus the status and funding actions, shared by the admin overview and users pages
export const UserManagementPanel = () => {
  const { data: users = [], isLoading, error, refetch } = useAdminUsers();
  const updateStatus = useUpdateUserStatus();
  const { showSuccess, showError } = useToast();
  const [targetUser, setTargetUser] = useState(null);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);

  const handleUpdateStatus = async (userId, status) => {
    try {
      await updateStatus.mutateAsync({ userId, status });
      showSuccess(`Account status updated to ${status}`);
    } catch (e) {
      showError(e.message || 'Failed to update status');
    }
  };

  const handleOpenFundModal = (user) => {
    setTargetUser(user);
    setIsFundModalOpen(true);
  };

  return (
    <>
      <UserApprovalTable
        users={users}
        loading={isLoading}
        error={error?.message}
        onRetry={() => refetch()}
        onUpdateStatus={handleUpdateStatus}
        onDisburseInitialFunds={handleOpenFundModal}
      />

      <InitialFundsModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        targetUser={targetUser}
      />
    </>
  );
};
