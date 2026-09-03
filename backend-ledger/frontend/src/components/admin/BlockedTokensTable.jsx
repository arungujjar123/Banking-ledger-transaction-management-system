import React from 'react';
import { ShieldAlert, Lock, Clock } from 'lucide-react';

export const BlockedTokensTable = ({ tokens = [] }) => {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Security & Blacklisted Tokens
          </h3>
          <p className="text-xs text-slate-400">JWT tokens revoked upon user logout or security invalidation</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Record ID</th>
              <th className="py-3 px-4">Revoked Token snippet</th>
              <th className="py-3 px-4">Revocation Reason</th>
              <th className="py-3 px-4">Blacklisted At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {tokens.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-500">
                  No blocked tokens found.
                </td>
              </tr>
            ) : (
              tokens.map((item) => (
                <tr key={item._id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                    {item._id}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 max-w-xs truncate">
                    <span className="text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
                      {item.token ? item.token.substring(0, 45) + '...' : '[REVOKED]'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">
                    {item.reason || 'User Logout'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent'}
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
