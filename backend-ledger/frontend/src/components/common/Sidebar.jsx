import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Users,
  BookOpenCheck,
  ShieldAlert,
  Receipt,
} from 'lucide-react';

const userNavItems = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Accounts', path: '/accounts', icon: CreditCard },
  { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
];

const adminNavItems = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Ledger', path: '/admin/ledger', icon: BookOpenCheck },
  { label: 'Transactions', path: '/admin/transactions', icon: Receipt },
  { label: 'Blocked tokens', path: '/admin/blocked-tokens', icon: ShieldAlert },
];

// Shared by the desktop sidebar and the mobile drawer in Navbar
export const SidebarNav = ({ onNavigate }) => {
  const { role } = useAuth();
  const navItems = role === 'admin' ? adminNavItems : userNavItems;

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      <div className="px-3 pb-2 text-xs font-semibold text-subtle">
        {role === 'admin' ? 'Admin' : 'Menu'}
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            end={item.path === '/dashboard' || item.path === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 h-10 rounded-control transition-colors',
                isActive ? 'bg-accent-soft text-accent-fg font-semibold' : 'text-muted font-medium hover:bg-surface-2 hover:text-fg'
              )
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export const Sidebar = () => (
  <aside className="w-60 shrink-0 hidden md:block border-r border-border bg-surface px-3.5 py-5">
    <SidebarNav />
  </aside>
);
