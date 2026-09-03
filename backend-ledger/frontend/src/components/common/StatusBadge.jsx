import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, Shield } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();

  const configs = {
    ACTIVE: {
      label: 'ACTIVE',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle,
    },
    COMPLETED: {
      label: 'COMPLETED',
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle,
    },
    PENDING: {
      label: 'PENDING',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Clock,
    },
    PENDING_APPROVAL: {
      label: 'PENDING APPROVAL',
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Clock,
    },
    FROZEN: {
      label: 'FROZEN',
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: AlertTriangle,
    },
    CLOSED: {
      label: 'CLOSED',
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      icon: XCircle,
    },
    FAILED: {
      label: 'FAILED',
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: XCircle,
    },
    REVERSED: {
      label: 'REVERSED',
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      icon: Shield,
    },
  };

  const config = configs[normalized] || {
    label: normalized || 'UNKNOWN',
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    icon: Clock,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.bg}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {config.label}
    </span>
  );
};
