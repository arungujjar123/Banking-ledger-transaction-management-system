import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export const EmptyState = ({ title = 'Nothing here yet', description, action }) => (
  <div className="py-10 px-4 text-center">
    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-500">
      <Inbox className="w-5 h-5" />
    </div>
    <p className="text-sm font-semibold text-slate-300">{title}</p>
    {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ message = 'Something went wrong', onRetry }) => (
  <div className="py-10 px-4 text-center">
    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-400">
      <AlertCircle className="w-5 h-5" />
    </div>
    <p className="text-sm font-semibold text-rose-300">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </button>
    )}
  </div>
);

export const LoadingRows = ({ rows = 4, cols }) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r}>
        {Array.from({ length: cols }).map((_, c) => (
          <td key={c} className="py-3.5 px-4">
            <div className="h-3 rounded bg-slate-800/80 animate-pulse" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const LoadingCards = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass-panel rounded-2xl p-5 h-48 animate-pulse">
        <div className="h-3 w-1/3 rounded bg-slate-800" />
        <div className="h-8 w-1/2 rounded bg-slate-800 mt-8" />
        <div className="h-8 w-full rounded-xl bg-slate-800 mt-8" />
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
      <tr>
        <td colSpan={colSpan}>
          <ErrorState message={error} onRetry={onRetry} />
        </td>
      </tr>
    );
  }

  if (isEmpty) {
    return (
      <tr>
        <td colSpan={colSpan}>
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </td>
      </tr>
    );
  }

  return children;
};
