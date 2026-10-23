import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({ className, children, ...props }) => (
  <div className={cn('glass-panel rounded-2xl p-5', className)} {...props}>
    {children}
  </div>
);

// Title + optional subtitle row used at the top of cards
export const CardHeader = ({ title, subtitle, actions, className }) => (
  <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4', className)}>
    <div>
      <h3 className="text-base font-bold text-white flex items-center gap-2">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
);
