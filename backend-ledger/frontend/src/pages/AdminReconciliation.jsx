import React from 'react';
import { Camera, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ErrorState, LoadingCards } from '../components/ui/States';
import { useReconciliation, useTakeSnapshots } from '../hooks/queries';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useToast } from '../context/ToastContext';
import { cn } from '../utils/cn';
import { formatDateTime } from '../utils/format';

const CheckRow = ({ check }) => {
  const Icon = check.passed ? CheckCircle2 : XCircle;

  return (
    <li className="flex gap-3.5 px-5 py-4">
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', check.passed ? 'text-accent' : 'text-debit')} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-semibold text-fg">{check.title}</h3>
          <span className="text-xs text-subtle tabular-nums">
            {check.checked.toLocaleString('en-IN')} checked
            {!check.passed && <span className="text-debit font-semibold"> · {check.failureCount} failed</span>}
          </span>
        </div>
        <p className="text-[13px] text-muted mt-0.5 leading-relaxed">{check.description}</p>
        {check.summary && <p className="text-[13px] text-fg mt-1.5 tabular-nums">{check.summary}</p>}
        {!check.passed && (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Failing records">
            {check.failures.map((failure) => (
              <li key={failure} className="rounded bg-debit-soft text-debit px-2 py-0.5 font-mono text-xs">
                {failure}
              </li>
            ))}
            {check.failureCount > check.failures.length && (
              <li className="text-xs text-subtle self-center">and {check.failureCount - check.failures.length} more</li>
            )}
          </ul>
        )}
      </div>
    </li>
  );
};

const SnapshotStatus = ({ snapshots }) =>
  snapshots.lastTakenAt ? (
    <>
      Balance snapshots cover {snapshots.accounts} {snapshots.accounts === 1 ? 'account' : 'accounts'} up to{' '}
      {formatDateTime(snapshots.asOf)}. A new one is taken every night at 00:10 IST.
    </>
  ) : (
    <>No balance snapshot yet, so balances are summed from every ledger entry. One is taken every night at 00:10 IST.</>
  );

export const AdminReconciliation = () => {
  useDocumentTitle('Reconciliation');
  const { data: report, isLoading, isFetching, error, refetch } = useReconciliation();
  const takeSnapshots = useTakeSnapshots();
  const { showSuccess, showError } = useToast();

  const handleSnapshot = async () => {
    try {
      const res = await takeSnapshots.mutateAsync();
      showSuccess(res.message);
    } catch (err) {
      showError(err.message || 'Could not take a snapshot');
    }
  };

  const failed = report?.checks.filter((c) => !c.passed).length ?? 0;

  return (
    <>
      <PageHeader
        title="Reconciliation"
        description="Proves the ledger is consistent: every check below re-reads the whole ledger and lists any record that breaks a rule."
        actions={
          <>
            <Button variant="secondary" icon={Camera} onClick={handleSnapshot} loading={takeSnapshots.isPending} loadingText="Taking...">
              Take snapshot now
            </Button>
            <Button icon={RefreshCw} onClick={() => refetch()} loading={isFetching} loadingText="Checking...">
              Run checks
            </Button>
          </>
        }
      />

      {isLoading ? (
        <LoadingCards count={1} />
      ) : error ? (
        <Card className="p-0">
          <ErrorState message={error.message} onRetry={() => refetch()} />
        </Card>
      ) : (
        <>
          <Card className={cn('flex items-start gap-3.5', failed ? 'border-debit/40' : 'border-accent/40')} role="status">
            {failed ? (
              <XCircle className="w-7 h-7 text-debit shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-7 h-7 text-accent shrink-0" aria-hidden="true" />
            )}
            <div>
              <p className="text-[17px] font-semibold text-fg">
                {failed
                  ? `${failed} of ${report.checks.length} checks failed`
                  : `All ${report.checks.length} checks passed`}
              </p>
              <p className="text-[13px] text-muted mt-1">
                Ran {formatDateTime(report.ranAt)}. <SnapshotStatus snapshots={report.snapshots} />
              </p>
            </div>
          </Card>

          <Card className="p-0">
            <ul className="divide-y divide-border">
              {report.checks.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </ul>
          </Card>
        </>
      )}
    </>
  );
};
