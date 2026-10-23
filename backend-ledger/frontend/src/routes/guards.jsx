import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const homeFor = (role) => (role === 'admin' ? '/admin' : '/dashboard');

// Renders child routes only for signed-in users (and only for `requiredRole`, if given)
export const ProtectedRoute = ({ requiredRole }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-bold text-sm">
        Loading LedgerX...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={homeFor(role)} replace />;
  }

  return <Outlet />;
};

// Sends unknown URLs to the right home page for the current role
export const HomeRedirect = () => {
  const { user, role, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={homeFor(role)} replace />;
};
