import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({ className, children, ...props }) => (
  <div className={cn('rounded-card border border-border bg-surface p-5 shadow-card dark:shadow-none', className)} {...props}>
    {children}
  </div>
);

// Title + optional subtitle row. `divided` draws a bottom border for cards whose
// content (like a table) runs edge to edge.
export const CardHeader = ({ title, subtitle, actions, divided = false, className }) => (
  <div
    className={cn(
      'flex flex-col sm:flex-row sm:items-center justify-between gap-3',
      divided ? 'px-5 py-4 border-b border-border' : 'mb-4',
      className
    )}
  >
    <div className="min-w-0">
      <h2 className="text-[17px] font-semibold text-fg flex items-center gap-2">{title}</h2>
      {subtitle && <p className="text-[13px] text-muted mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
  </div>
);
