import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Building2, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      showSuccess('Account created successfully! Welcome to LedgerX.');
      navigate('/dashboard');
    } catch (err) {
      showError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel rounded-3xl p-8 border border-emerald-500/25 shadow-2xl relative z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-glow-emerald mb-3">
            <Building2 className="h-7 w-7 text-slate-950 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Create your Ledger<span className="text-emerald-400">X</span> Account
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Join the immutable financial ledger system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
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
                placeholder="At least 6 characters"
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
            {loading ? 'Creating Account...' : 'Register'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
