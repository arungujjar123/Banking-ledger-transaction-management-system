import React, { useId } from 'react';
import { cn } from '../../utils/cn';

const fieldClasses =
  'w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors';

const Label = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-300 mb-1">
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
        {Icon && <Icon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />}
        {prefix && <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-semibold">{prefix}</span>}
        <input
          id={inputId}
          className={cn(fieldClasses, Icon ? 'pl-10 pr-3' : prefix ? 'pl-8 pr-3' : 'px-3', mono && 'font-mono', className)}
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
