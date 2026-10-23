import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

const variants = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover font-semibold',
  secondary: 'bg-surface text-fg border border-border-strong hover:bg-surface-2 font-semibold',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2 font-medium',
  danger: 'bg-debit-soft text-debit hover:brightness-95 dark:hover:brightness-125 font-semibold',
};

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-control gap-2',
  lg: 'h-11 px-5 text-sm rounded-control gap-2',
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
      'inline-flex items-center justify-center whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
      focusRing,
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className
    )}
    {...props}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4 shrink-0" />}
    {loading && loadingText ? loadingText : children}
  </button>
);

// Square icon-only button; `label` is required for screen readers
export const IconButton = ({ icon: Icon, label, spinning = false, bordered = true, className, ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={cn(
      'h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-control text-muted hover:text-fg transition-colors disabled:opacity-50',
      focusRing,
      bordered ? 'border border-border bg-surface hover:bg-surface-2' : 'hover:bg-surface-2',
      className
    )}
    {...props}
  >
    <Icon className={cn('w-[18px] h-[18px]', spinning && 'animate-spin')} />
  </button>
);
