import React from 'react';

export const PageHeader = ({ title, description, badge, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div className="min-w-0">
      {badge}
      <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-fg">{title}</h1>
      {description && <p className="text-muted mt-1.5">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
  </div>
);
