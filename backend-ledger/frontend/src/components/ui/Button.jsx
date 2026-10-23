import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

const variants = {
  // Gradient call-to-action (sign in, submit transfer)
  primary: 'bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-slate-950 font-extrabold shadow-glow-emerald',
  // Flat emerald action (page header actions)
  solid: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-glow-emerald',
  secondary: 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-semibold',
  outline: 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold',
  info: 'bg-blue-950 hover:bg-blue-900 border border-blue-500/40 text-blue-300 font-semibold',
  ghost: 'text-slate-400 hover:text-white font-semibold',
};

const sizes = {
  sm: 'px-2.5 py-1 text-[11px] rounded-lg gap-1',
  md: 'px-4 py-2 text-xs rounded-xl gap-1.5',
  lg: 'px-5 py-3 text-sm rounded-xl gap-2',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  loadingText,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className
    )}
    {...props}
  >
    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4 shrink-0" />}
    {loading && loadingText ? loadingText : children}
  </button>
);

// Square icon-only button; `label` is required for screen readers
export const IconButton = ({ icon: Icon, label, spinning = false, className, ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={cn(
      'p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-50',
      className
    )}
    {...props}
  >
    <Icon className={cn('w-4 h-4', spinning && 'animate-spin text-emerald-400')} />
  </button>
);
