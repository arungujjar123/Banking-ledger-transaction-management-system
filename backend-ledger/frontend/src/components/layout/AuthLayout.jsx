import React from 'react';
import { Check } from 'lucide-react';
import { Logo } from '../common/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';

const features = [
  { title: 'Immutable entries.', text: 'Ledger records cannot be updated or deleted.' },
  { title: 'Safe retries.', text: 'Idempotency keys stop a transfer from running twice.' },
  { title: 'All or nothing.', text: 'Debit and credit are written in one database transaction.' },
];

// Split screen for login and register: product story on the left (wide screens), form on the right
export const AuthLayout = ({ children }) => (
  <div className="min-h-screen flex">
    <section className="hidden lg:flex flex-1 flex-col justify-between gap-10 p-14 bg-bg border-r border-border">
      <Logo size="lg" />

      <div className="max-w-[460px]">
        <h1 className="text-4xl leading-tight font-bold tracking-tight text-fg">
          A double-entry ledger you can audit line by line.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Every transfer is recorded as a matching debit and credit, so balances are always derived from history, never edited.
        </p>
        <ul className="mt-7 flex flex-col gap-3.5">
          {features.map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <span className="h-7 w-7 shrink-0 rounded-lg bg-accent-soft text-accent-fg flex items-center justify-center">
                <Check className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="leading-relaxed">
                <strong className="font-semibold text-fg">{f.title}</strong> <span className="text-muted">{f.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[13px] text-subtle">
        Portfolio project · Node.js, Express, MongoDB, React ·{' '}
        {/* Served by Express, not a React route */}
        <a href="/api/docs/" className="font-semibold text-muted underline underline-offset-2 hover:text-fg">
          API docs
        </a>
      </p>
    </section>

    <section className="flex-1 flex flex-col bg-surface">
      <div className="flex items-center justify-between lg:justify-end p-4 sm:p-6">
        <span className="lg:hidden"><Logo /></span>
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </section>
  </div>
);
