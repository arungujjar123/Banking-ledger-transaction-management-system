import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

// `label` is the accessible name; `placeholder` defaults to it but can be shorter
export const SearchInput = ({ label, placeholder, className, ...props }) => (
  <div className={cn('relative', className)}>
    <Search className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    <input
      type="search"
      aria-label={label}
      placeholder={placeholder ?? label}
      className="h-9 w-full rounded-control border border-border bg-surface-2 pl-9 pr-3 text-sm text-fg placeholder:text-subtle outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
      {...props}
    />
  </div>
);
