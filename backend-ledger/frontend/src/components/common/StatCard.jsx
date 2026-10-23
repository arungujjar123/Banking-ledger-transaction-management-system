import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

const iconTones = {
  default: 'text-subtle',
  credit: 'text-accent',
  debit: 'text-debit',
};

export const StatCard = ({ title, value, subtitle, icon: Icon, tone = 'default' }) => (
  <Card>
    <div className="flex items-center justify-between gap-3 text-muted font-medium">
      {title}
      {Icon && <Icon className={cn('w-[18px] h-[18px] shrink-0', iconTones[tone])} aria-hidden="true" />}
    </div>
    <div className="text-[28px] font-bold tracking-tight tabular-nums text-fg mt-2.5">{value}</div>
    {subtitle && <div className="text-[13px] text-subtle mt-1">{subtitle}</div>}
  </Card>
);
