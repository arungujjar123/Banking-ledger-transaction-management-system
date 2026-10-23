import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Building2, ArrowRight, Lock, Mail, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const { login, demoLogin } = useAuth();
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
      const data = await login(email, password);
      showSuccess(`Welcome back, ${data.user.name}!`);
      navigate(data.user.systemUser ? '/admin' : '/dashboard');
    } catch (err) {
      showError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      showSuccess('Welcome! You are exploring the demo account.');
      navigate('/dashboard');
    } catch (err) {
      showError(err.message || 'Demo account is not available right now');
    } finally {
      setDemoLoading(false);
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            icon={Mail}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
          />

          <Input
            label="Password"
            icon={Lock}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button type="submit" size="lg" fullWidth disabled={loading} className="mt-2">
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* One-click demo login */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <Button
            variant="outline"
            size="lg"
            fullWidth
            icon={PlayCircle}
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="py-2.5 border-emerald-500/30 text-emerald-300 font-bold"
          >
            {demoLoading ? 'Opening demo...' : 'Explore with Demo Account'}
          </Button>
          <p className="text-xs text-slate-500 mt-2">
            Pre-funded account with sample transactions. No sign-up needed.
          </p>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-emerald-400 font-bold hover:underline">
            Create an Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
