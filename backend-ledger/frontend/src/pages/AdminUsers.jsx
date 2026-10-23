import React from 'react';
import { UserManagementPanel } from '../components/admin/UserManagementPanel';
import { PageHeader } from '../components/ui/PageHeader';
import { Users } from 'lucide-react';

export const AdminUsers = () => (
  <>
    <PageHeader
      icon={Users}
      title="User Account Approvals & Management"
      description="Approve, freeze, or disburse initial reserve funds to registered user accounts"
    />

    <UserManagementPanel />
  </>
);
