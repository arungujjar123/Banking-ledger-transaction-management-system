import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Building2, ShieldCheck, ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleSelection, setRoleSelection] = useState('user'); // 'user' | 'admin'
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please provide both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password, roleSelection);
      showSuccess(`Welcome back! Logged in as ${roleSelection === 'admin' ? 'Administrator' : 'User'}`);
      navigate(roleSelection === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      showError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
    setRoleSelection(role);
    if (role === 'admin') {
      setEmail('system@ledger.internal');
      setPassword('admin123');
    } else {
      setEmail('user@example.com');
      setPassword('user1234');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel rounded-3xl p-8 border border-emerald-500/25 shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-glow-emerald mb-3">
            <Building2 className="h-7 w-7 text-slate-950 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Sign in to Ledger<span className="text-emerald-400">X</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable Double-Entry Accounting Platform
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setRoleSelection('user')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              roleSelection === 'user'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            User Account
          </button>
          <button
            type="button"
            onClick={() => setRoleSelection('admin')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              roleSelection === 'admin'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Admin Portal
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-slate-950 font-extrabold text-sm shadow-glow-emerald transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Login Quick Fills */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] font-semibold text-slate-400 mb-2">Quick Demo Fills:</p>
          <div className="flex justify-center gap-2 text-xs">
            <button
              onClick={() => setDemoCredentials('user')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 text-[11px]"
            >
              Fill User Demo
            </button>
            <button
              onClick={() => setDemoCredentials('admin')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-400 border border-teal-500/20 text-[11px]"
            >
              Fill Admin Demo
            </button>
          </div>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 font-bold hover:underline">
            Create an Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
