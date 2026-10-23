import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({ title = 'Nothing here yet', description, action }) => (
  <div className="py-12 px-4 text-center">
    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 border border-border text-subtle">
      <Inbox className="w-5 h-5" />
    </div>
    <p className="font-semibold text-fg">{title}</p>
    {description && <p className="text-[13px] text-muted mt-1">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ message = 'Something went wrong', onRetry }) => (
  <div className="py-12 px-4 text-center">
    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-debit-soft text-debit">
      <AlertCircle className="w-5 h-5" />
    </div>
    <p className="font-semibold text-fg">{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry} className="mt-4">
        Retry
      </Button>
    )}
  </div>
);

export const LoadingRows = ({ rows = 4, cols }) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r} className="border-t border-border">
        {Array.from({ length: cols }).map((_, c) => (
          <td key={c} className="px-5 py-4">
            <div className="h-3 rounded bg-surface-2 dark:bg-border animate-pulse" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const LoadingCards = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-card border border-border bg-surface p-5 h-[196px] animate-pulse">
        <div className="h-3 w-1/3 rounded bg-surface-2 dark:bg-border" />
        <div className="h-8 w-1/2 rounded bg-surface-2 dark:bg-border mt-8" />
        <div className="h-10 w-full rounded-control bg-surface-2 dark:bg-border mt-8" />
      </div>
    ))}
  </>
);

/**
 * Picks the table body to render: skeleton rows on first load, an error with retry,
 * an empty message, or the actual rows passed as children
 */
export const TableContent = ({ colSpan, loading, error, onRetry, isEmpty, emptyTitle, emptyDescription, children }) => {
  if (loading && isEmpty) return <LoadingRows cols={colSpan} />;

  if (error) {
    return (
      <tr className="border-t border-border">
        <td colSpan={colSpan}>
          <ErrorState message={error} onRetry={onRetry} />
        </td>
      </tr>
    );
  }

  if (isEmpty) {
    return (
      <tr className="border-t border-border">
        <td colSpan={colSpan}>
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </td>
      </tr>
    );
  }

  return children;
};
