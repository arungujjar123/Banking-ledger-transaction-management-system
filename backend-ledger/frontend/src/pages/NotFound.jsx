import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/common/Logo';
import { Button } from '../components/ui/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const NotFound = () => {
  useDocumentTitle('Page not found');
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const home = !user ? '/login' : role === 'admin' ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo size="lg" />
      <div>
        <p className="text-sm font-semibold text-accent">404</p>
        <h1 className="text-2xl font-bold tracking-tight text-fg mt-1">Page not found</h1>
        <p className="text-muted mt-2">The page you are looking for does not exist or has moved.</p>
      </div>
      <Button onClick={() => navigate(home, { replace: true })}>{user ? 'Back to overview' : 'Go to sign in'}</Button>
    </div>
  );
};
