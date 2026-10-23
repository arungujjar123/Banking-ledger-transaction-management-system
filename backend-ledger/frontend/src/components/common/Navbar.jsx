import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { IconButton } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Badge } from './StatusBadge';
import { Logo } from './Logo';
import { SidebarNav } from './Sidebar';

export const Navbar = () => {
  const { user, role, logout } = useAuth();
  const { showInfo } = useToast();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    showInfo('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 h-16 flex items-center justify-between gap-3 px-3 sm:px-6 border-b border-border bg-surface">
      <div className="flex items-center gap-1.5">
        {/* Mobile menu toggle (sidebar is hidden below md) */}
        <IconButton icon={Menu} label="Open navigation menu" bordered={false} onClick={() => setIsMenuOpen(true)} className="md:hidden" />
        <button
          type="button"
          onClick={() => navigate(role === 'admin' ? '/admin' : '/dashboard')}
          className="rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          aria-label="Go to overview"
        >
          <Logo />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-2.5 sm:pl-3 sm:border-l border-border">
            <div className="h-9 w-9 shrink-0 rounded-full bg-accent-soft text-accent-fg font-semibold flex items-center justify-center" aria-hidden="true">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block leading-tight">
              <div className="font-semibold text-fg flex items-center gap-2">
                {user.name}
                {role === 'admin' && <Badge tone="info">Admin</Badge>}
              </div>
              <div className="text-xs text-subtle">{user.email}</div>
            </div>
            <IconButton icon={LogOut} label="Log out" bordered={false} onClick={handleLogout} />
          </div>
        )}
      </div>

      {/* Mobile navigation drawer. Portalled to body so it is never clipped by the header. */}
      {createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="absolute inset-0 bg-slate-950/50 dark:bg-black/70"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-surface border-r border-border p-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <Logo />
                  <IconButton icon={X} label="Close navigation menu" bordered={false} onClick={() => setIsMenuOpen(false)} />
                </div>
                <SidebarNav onNavigate={() => setIsMenuOpen(false)} />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
};
