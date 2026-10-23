import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const Login = () => {
  useDocumentTitle('Sign in');
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
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-fg">Sign in</h2>
          <p className="text-muted mt-1.5">Welcome back. Enter your details to continue.</p>
        </div>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          required
        />

        <Button type="submit" size="lg" fullWidth loading={loading} loadingText="Signing in...">
          Sign in
        </Button>

        <div className="flex items-center gap-3 text-[13px] text-subtle">
          <span className="flex-1 h-px bg-border" />
          or
          <span className="flex-1 h-px bg-border" />
        </div>

        <div>
          <Button variant="secondary" size="lg" fullWidth icon={PlayCircle} onClick={handleDemoLogin} loading={demoLoading} loadingText="Opening demo...">
            Explore the demo account
          </Button>
          <p className="text-center text-[13px] text-subtle mt-2">Pre-funded with sample transactions. No sign-up needed.</p>
        </div>

        <p className="text-center text-muted mt-1">
          New here?{' '}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
