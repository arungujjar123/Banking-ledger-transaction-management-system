import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAccountBalance } from '../../hooks/queries';
import { accountLabel, formatCurrency } from '../../utils/format';

export const AccountCard = ({ account, onSelectForTransfer }) => {
  const [copied, setCopied] = useState(false);
  const { data: balance, isLoading } = useAccountBalance(account._id);

  const copyId = () => {
    navigator.clipboard.writeText(account._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-fg">{accountLabel(account._id)}</div>
          <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-subtle">
            <span className="truncate">{account._id}</span>
            <button
              onClick={copyId}
              className="shrink-0 p-0.5 rounded hover:text-fg transition-colors"
              aria-label={copied ? 'Account ID copied' : 'Copy account ID'}
              title="Copy account ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <StatusBadge status={account.status} />
      </div>

      <div>
        <div className="text-[13px] text-muted">Available balance</div>
        {isLoading ? (
          <div className="h-9 w-40 mt-1 rounded bg-surface-2 dark:bg-border animate-pulse" />
        ) : (
          <div className="text-[30px] font-bold tracking-tight tabular-nums text-fg mt-0.5">{formatCurrency(balance)}</div>
        )}
      </div>

      {onSelectForTransfer && (
        <Button
          variant="secondary"
          fullWidth
          onClick={() => onSelectForTransfer(account._id)}
          disabled={account.status !== 'ACTIVE'}
        >
          {account.status === 'ACTIVE'
            ? 'Transfer from this account'
            : account.status === 'PENDING'
              ? 'Waiting for approval'
              : 'Transfers paused'}
        </Button>
      )}
    </Card>
  );
};
