import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { CheckCircle2, AlertOctagon, DollarSign, Shield } from 'lucide-react';

export const UserApprovalTable = ({ users = [], onUpdateStatus, onDisburseInitialFunds }) => {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Registered Users & Account Approvals</h3>
          <p className="text-xs text-slate-400">Review pending accounts, approve registered users, freeze or disburse funds</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Account Status</th>
              <th className="py-3 px-4">Registered Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500">
                  No registered users found in database.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200">{u.name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {u.systemUser ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        <Shield className="w-3 h-3" /> SYSTEM ADMIN
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Standard User</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={u.status || 'PENDING'} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Approve / Activate Button */}
                      {u.status !== 'ACTIVE' && (
                        <button
                          onClick={() => onUpdateStatus(u._id, 'ACTIVE')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1.5 transition-all shadow-glow-emerald"
                          title="Approve user registration and activate account"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve Account
                        </button>
                      )}

                      {/* Freeze Account Button */}
                      {u.status === 'ACTIVE' && !u.systemUser && (
                        <button
                          onClick={() => onUpdateStatus(u._id, 'FROZEN')}
                          className="px-2.5 py-1 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-500/40 text-blue-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <AlertOctagon className="w-3.5 h-3.5 text-blue-400" /> Freeze
                        </button>
                      )}

                      {/* Initial Funding Button */}
                      <button
                        onClick={() => onDisburseInitialFunds(u)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                        title="Disburse initial funds from System user"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Disburse Funds
                      </button>
                    </div>
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
