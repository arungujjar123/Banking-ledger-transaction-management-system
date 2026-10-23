import React from 'react';
import { Alert } from '../ui/Alert';

// Explains why transfers are unavailable while accounts wait for approval or are frozen
export const AccountStatusBanner = ({ accounts = [] }) => {
  if (accounts.length === 0) return null;

  const active = accounts.filter((a) => a.status === 'ACTIVE').length;
  const pending = accounts.filter((a) => a.status === 'PENDING').length;
  const frozen = accounts.filter((a) => a.status === 'FROZEN').length;

  if (active === 0 && pending > 0) {
    return (
      <Alert tone="warning" title="Waiting for admin approval">
        Your account has been created and an admin needs to approve it. You can look around in the meantime;
        transfers unlock as soon as it is approved.
      </Alert>
    );
  }

  if (active === 0 && frozen > 0) {
    return (
      <Alert tone="frozen" title="Your account is frozen">
        Transfers are paused on this account. Contact the administrator to have it reactivated.
      </Alert>
    );
  }

  if (pending > 0) {
    return (
      <Alert tone="info">
        {pending === 1 ? '1 account is' : `${pending} accounts are`} waiting for admin approval and can be used once approved.
      </Alert>
    );
  }

  return null;
};
