import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, User, LogOut, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, role, logout } = useAuth();
  const { showInfo } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showInfo('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/30 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(role === 'admin' ? '/admin' : '/dashboard')}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-glow-emerald">
            <Building2 className="h-5 w-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              Ledger<span className="text-emerald-400">X</span>
            </span>
            <span className="block text-[10px] uppercase tracking-wider font-semibold text-emerald-400/80">
              Double-Entry Ledger
            </span>
          </div>
        </div>

        {/* Right Section: Role Indicator & User Profile */}
        <div className="flex items-center gap-3">
          {/* Read-Only Role Badge */}
          {role === 'admin' ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>System Administrator</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-800">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Standard User</span>
            </div>
          )}

          {/* User Info & Avatar */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="hidden md:block text-right">
                <div className="text-sm font-semibold text-slate-200">{user.name}</div>
                <div className="text-xs text-slate-400">{user.email}</div>
              </div>
              
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors ml-1"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
