import React from 'react';
import { cn } from '../../utils/cn';

// Row of toggle buttons for picking one filter; options: [{ value, label }]
export const SegmentedControl = ({ label, options, value, onChange }) => (
  <div role="group" aria-label={label} className="flex p-[3px] rounded-control bg-surface-2 border border-border">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        aria-pressed={value === option.value}
        className={cn(
          'px-3 h-[30px] rounded-lg text-sm whitespace-nowrap transition-colors',
          value === option.value ? 'bg-surface text-fg font-semibold shadow-card dark:bg-border' : 'text-muted hover:text-fg'
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);
