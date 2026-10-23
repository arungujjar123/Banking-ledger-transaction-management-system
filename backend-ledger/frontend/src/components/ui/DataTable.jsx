import React from 'react';
import { TableContent } from './States';
import { cn } from '../../utils/cn';

/**
 * Generic table driven by a column config:
 *   { key, header, render?: (row) => node, className?, headerClassName? }
 * Loading, error and empty states are handled here so every table behaves the same.
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
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-xs">
      <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={cn('py-3 px-4', col.headerClassName)}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/50">
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
            <tr key={row[rowKey]} className="hover:bg-slate-900/40 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={cn('py-3.5 px-4', col.className)}>
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
