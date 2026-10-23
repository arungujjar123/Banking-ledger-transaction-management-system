import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { LedgerTable } from '../components/user/LedgerTable';
import { adminService } from '../services/api';
import { BookOpenCheck } from 'lucide-react';

export const AdminLedger = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await adminService.getAllLedgerEntries());
    } catch (e) {
      setError(e.message || 'Failed to load ledger entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <BookOpenCheck className="w-6 h-6 text-emerald-400" />
              Global System Ledger
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Complete double-entry audit history across all system accounts
            </p>
          </div>

          <LedgerTable entries={entries} loading={loading} error={error} onRetry={loadEntries} />
        </main>
      </div>
    </div>
  );
};
