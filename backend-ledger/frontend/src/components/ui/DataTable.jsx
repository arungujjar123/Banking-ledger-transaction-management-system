import React from 'react';
import { TableContent } from './States';
import { cn } from '../../utils/cn';

/**
 * Generic table driven by a column config:
 *   { key, header, render?: (row) => node, align?: 'right', className? }
 * Loading, error and empty states are handled here so every table behaves the same.
 * Meant to sit edge to edge inside a Card with `p-0`.
 */
export const DataTable = ({
  columns,
  rows,
  rowKey = '_id',
  loading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyDescription,
  minWidth = 640,
}) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-sm" style={{ minWidth }}>
      <thead>
        <tr className="text-left text-xs text-subtle">
          {columns.map((col) => (
            <th key={col.key} className={cn('px-5 py-3 font-semibold whitespace-nowrap', col.align === 'right' && 'text-right')}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <TableContent
          colSpan={columns.length}
          loading={loading}
          error={error}
          onRetry={onRetry}
          isEmpty={rows.length === 0}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        >
          {rows.map((row) => (
            <tr key={row[rowKey]} className="border-t border-border hover:bg-surface-2 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={cn('px-5 py-3.5', col.align === 'right' && 'text-right', col.className)}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </TableContent>
      </tbody>
    </table>
  </div>
);
