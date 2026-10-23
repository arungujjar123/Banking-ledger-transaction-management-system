import React from 'react';
import { cn } from '../../utils/cn';

export const PageHeader = ({ icon: Icon, iconClassName, title, description, badge, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      {badge}
      <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
        {Icon && <Icon className={cn('w-6 h-6 text-emerald-400', iconClassName)} />}
        {/* Wrapped so mixed text + elements keep normal inline spacing inside the flex row */}
        <span>{title}</span>
      </h1>
      {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
);
