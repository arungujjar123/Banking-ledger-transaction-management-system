import React, { useId } from 'react';
import { cn } from '../../utils/cn';

const fieldClasses =
  'h-11 w-full rounded-control border border-border-strong bg-surface text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20';

const Label = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-fg mb-1.5">
    {children}
  </label>
);

// `icon` renders a Lucide icon inside the field; `prefix` renders text such as "₹"
export const Input = ({ label, icon: Icon, prefix, mono = false, className, id, ...props }) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />}
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle font-medium pointer-events-none">{prefix}</span>
        )}
        <input
          id={inputId}
          className={cn(fieldClasses, Icon || prefix ? 'pl-10 pr-3.5' : 'px-3.5', mono && 'font-mono', className)}
          {...props}
        />
      </div>
    </div>
  );
};

export const Select = ({ label, mono = false, className, id, children, ...props }) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div>
      {label && <Label htmlFor={selectId}>{label}</Label>}
      <select id={selectId} className={cn(fieldClasses, 'px-3', mono && 'font-mono', className)} {...props}>
        {children}
      </select>
    </div>
  );
};
