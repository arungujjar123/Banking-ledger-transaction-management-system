import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
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
          <Input
            label="Full Name"
            icon={User}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Morgan"
            required
          />

          <Input
            label="Email Address"
            icon={Mail}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@example.com"
            required
          />

          <Input
            label="Password"
            icon={Lock}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />

          <Button type="submit" size="lg" fullWidth disabled={loading} className="mt-2">
            {loading ? 'Creating Account...' : 'Register'}
            <ArrowRight className="w-4 h-4" />
          </Button>
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
