import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { BlockedTokensTable } from '../components/admin/BlockedTokensTable';
import { adminService } from '../services/api';
import { ShieldAlert } from 'lucide-react';

export const AdminBlockedTokens = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTokens = async () => {
    setLoading(true);
    setError(null);
    try {
      setTokens(await adminService.getBlockedTokens());
    } catch (e) {
      setError(e.message || 'Failed to load blocked tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
              Blacklisted JWT Tokens
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Security log of revoked JWT authorization tokens
            </p>
          </div>

          <BlockedTokensTable tokens={tokens} loading={loading} error={error} onRetry={loadTokens} />
        </main>
      </div>
    </div>
  );
};
