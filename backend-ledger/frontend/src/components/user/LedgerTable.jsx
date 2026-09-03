import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search, Filter } from 'lucide-react';

export const LedgerTable = ({ entries = [] }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredEntries = entries.filter((item) => {
    const matchesSearch =
      (item.account || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.transaction || '').toLowerCase().includes(search.toLowerCase()) ||
      (item._id || '').toLowerCase().includes(search.toLowerCase());

    if (filterType === 'CREDIT') return matchesSearch && item.type === 'CREDIT';
    if (filterType === 'DEBIT') return matchesSearch && item.type === 'DEBIT';
    return matchesSearch;
  });

  return (
    <div className="glass-panel rounded-2xl p-5">
      {/* Controls: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Ledger Audit Log
          </h3>
          <p className="text-xs text-slate-400">
            Immutable credit & debit records for your accounts
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Ledger ID / Txn..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterType === 'ALL'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('CREDIT')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterType === 'CREDIT'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Credits
            </button>
            <button
              onClick={() => setFilterType('DEBIT')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterType === 'DEBIT'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Debits
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Entry ID</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Account ID</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Transaction Ref</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">
                  No ledger entries found.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry._id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-300">
                    {entry._id}
                  </td>
                  <td className="py-3 px-4">
                    {entry.type === 'CREDIT' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        <ArrowDownLeft className="w-3 h-3" /> CREDIT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        <ArrowUpRight className="w-3 h-3" /> DEBIT
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {entry.account}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-white text-sm">
                    {entry.type === 'CREDIT' ? '+' : '-'} ₹{(entry.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {entry.transaction || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Just now'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
