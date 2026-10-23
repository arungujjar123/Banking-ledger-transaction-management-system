import React from 'react';
import { UserManagementPanel } from '../components/admin/UserManagementPanel';
import { PageHeader } from '../components/ui/PageHeader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const AdminUsers = () => {
  useDocumentTitle('Users');

  return (
    <>
      <PageHeader title="Users" description="New accounts start as pending until an admin approves them." />
      <UserManagementPanel />
    </>
  );
};
