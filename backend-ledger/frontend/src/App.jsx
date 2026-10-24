import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, HomeRedirect } from './routes/guards';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UserDashboard } from './pages/UserDashboard';
import { UserAccounts } from './pages/UserAccounts';
import { UserTransactions } from './pages/UserTransactions';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsers } from './pages/AdminUsers';
import { AdminLedger } from './pages/AdminLedger';
import { AdminTransactions } from './pages/AdminTransactions';
import { AdminApprovals } from './pages/AdminApprovals';
import { AdminReconciliation } from './pages/AdminReconciliation';
import { AdminBlockedTokens } from './pages/AdminBlockedTokens';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Signed-in pages share the Navbar + Sidebar layout */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<UserDashboard />} />
                    <Route path="/accounts" element={<UserAccounts />} />
                    <Route path="/transactions" element={<UserTransactions />} />

                    <Route element={<ProtectedRoute requiredRole="admin" />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/ledger" element={<AdminLedger />} />
                      <Route path="/admin/transactions" element={<AdminTransactions />} />
                      <Route path="/admin/approvals" element={<AdminApprovals />} />
                      <Route path="/admin/reconciliation" element={<AdminReconciliation />} />
                      <Route path="/admin/blocked-tokens" element={<AdminBlockedTokens />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="/" element={<HomeRedirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
