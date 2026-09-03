import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  CreditCard, 
  ArrowLeftRight, 
  Users, 
  BookOpenCheck, 
  ShieldAlert, 
  Receipt,
  Sparkles,
  Layers
} from 'lucide-react';

export const Sidebar = () => {
  const { role } = useAuth();

  const userNavItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Accounts Info', path: '/accounts', icon: CreditCard },
    { label: 'Transactions & Ledger', path: '/transactions', icon: ArrowLeftRight },
  ];

  const adminNavItems = [
    { label: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'User Approvals', path: '/admin/users', icon: Users },
    { label: 'Global Ledger', path: '/admin/ledger', icon: BookOpenCheck },
    { label: 'All Transactions', path: '/admin/transactions', icon: Receipt },
    { label: 'Blocked Tokens', path: '/admin/blocked-tokens', icon: ShieldAlert },
  ];

  const navItems = role === 'admin' ? adminNavItems : userNavItems;

  return (
    <aside className="w-64 shrink-0 hidden md:block min-h-[calc(100vh-4rem)] border-r border-emerald-900/20 bg-slate-950/60 p-4">
      {/* Role Banner */}
      <div className="mb-6 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300">
            {role === 'admin' ? 'ADMINISTRATOR' : 'STANDARD USER'}
          </span>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
          Live
        </span>
      </div>

      {/* Navigation List */}
      <nav className="space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard' || item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shadow-glow-emerald font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Info Box at bottom of Sidebar */}
      <div className="mt-12 p-4 rounded-xl bg-gradient-to-b from-emerald-950/40 to-slate-900/40 border border-emerald-500/20">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Double-Entry Protected</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          All financial movements create immutable Credit & Debit ledger entries.
        </p>
      </div>
    </aside>
  );
};
