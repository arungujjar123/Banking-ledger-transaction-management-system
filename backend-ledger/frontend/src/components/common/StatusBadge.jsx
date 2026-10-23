import React from 'react';
import { cn } from '../../utils/cn';

const tones = {
  success: 'bg-accent-soft text-accent-fg',
  warning: 'bg-warn-soft text-warn',
  info: 'bg-info-soft text-info',
  danger: 'bg-debit-soft text-debit',
  neutral: 'bg-surface-2 text-muted border border-border',
};

const statuses = {
  ACTIVE: { label: 'Active', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  PENDING: { label: 'Pending', tone: 'warning' },
  FROZEN: { label: 'Frozen', tone: 'info' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
  FAILED: { label: 'Failed', tone: 'danger' },
  REVERSED: { label: 'Reversed', tone: 'info' },
};

export const Badge = ({ tone = 'neutral', className, children }) => (
  <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', tones[tone], className)}>
    {children}
  </span>
);

export const StatusBadge = ({ status }) => {
  const key = (status || '').toUpperCase();
  const config = statuses[key] || { label: key || 'Unknown', tone: 'neutral' };

  return <Badge tone={config.tone}>{config.label}</Badge>;
};
