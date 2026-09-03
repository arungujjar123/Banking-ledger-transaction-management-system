import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { StatusBadge } from '../components/common/StatusBadge';
import { adminService } from '../services/api';
import { Receipt, Search } from 'lucide-react';

export const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminService.getAllTransactions().then((data) => setTransactions(data));
  }, []);

  const filtered = transactions.filter(
    (t) =>
      (t._id || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.fromAccount || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.toAccount || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.idempotencyKey || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Receipt className="w-6 h-6 text-emerald-400" />
                All System Transactions
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Audit transactions, processing statuses, and idempotency keys
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Txn ID / Account / Key..."
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
              />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Txn ID</th>
                    <th className="py-3 px-4">From Account</th>
                    <th className="py-3 px-4">To Account</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Idempotency Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filtered.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                        {t._id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{t.fromAccount}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{t.toAccount}</td>
                      <td className="py-3.5 px-4 font-extrabold text-white text-sm">
                        ₹{(t.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                        {t.idempotencyKey}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
