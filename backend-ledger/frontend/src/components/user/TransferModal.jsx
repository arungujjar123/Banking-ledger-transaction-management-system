import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Send, XCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { generateIdempotencyKey } from '../../services/api';
import { useAccountBalance, useAccountLookup, useCreateTransfer } from '../../hooks/queries';
import { useToast } from '../../context/ToastContext';
import { accountLabel, formatCurrency, parseRupeesToPaise, shortId } from '../../utils/format';

const ACCOUNT_ID_PATTERN = /^[a-f\d]{24}$/i;

// Inline status under the "To account" field: who the money is going to, or why it can't go there
const RecipientStatus = ({ toAccount, fromAccount, lookup }) => {
  if (!toAccount) return null;

  if (!ACCOUNT_ID_PATTERN.test(toAccount)) {
    return <p className="text-[13px] text-subtle mt-1.5">Account IDs are 24 characters (0-9, a-f).</p>;
  }

  if (toAccount === fromAccount) {
    return <StatusLine ok={false}>Choose a different account than the one you are sending from.</StatusLine>;
  }

  if (lookup.isLoading) {
    return (
      <p className="flex items-center gap-1.5 text-[13px] text-muted mt-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Checking account...
      </p>
    );
  }

  if (lookup.error) {
    return <StatusLine ok={false}>{lookup.error.message || 'Could not check this account'}</StatusLine>;
  }

  const recipient = lookup.data;
  if (!recipient) return null;

  if (recipient.status !== 'ACTIVE') {
    return <StatusLine ok={false}>This account is not active yet, so it cannot receive transfers.</StatusLine>;
  }

  return (
    <StatusLine ok>
      Sending to <span className="font-semibold text-fg">{recipient.isOwnAccount ? `your ${accountLabel(toAccount).toLowerCase()}` : recipient.ownerName}</span>
    </StatusLine>
  );
};

const StatusLine = ({ ok, children }) => {
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <p className={`flex items-start gap-1.5 text-[13px] mt-1.5 ${ok ? 'text-muted' : 'text-debit'}`}>
      <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${ok ? 'text-accent' : ''}`} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
};

const SummaryRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-t border-border first:border-t-0">
    <span className="text-muted">{label}</span>
    <span className="text-right text-fg">{children}</span>
  </div>
);

export const TransferModal = ({ isOpen, onClose, userAccounts = [], defaultFromAccount = '' }) => {
  const [step, setStep] = useState('form'); // 'form' | 'review' | 'done'
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);
  const { showError } = useToast();
  const transfer = useCreateTransfer();

  // One idempotency key per distinct transfer: retrying the same details reuses it (so a
  // timed-out request can never run twice), while editing the details gets a fresh key.
  const idempotencyRef = useRef({ key: '', details: '' });

  const activeAccounts = userAccounts.filter((a) => a.status === 'ACTIVE');
  const recipientId = toAccount.trim();
  const lookup = useAccountLookup(recipientId);
  const { data: available, isLoading: balanceLoading } = useAccountBalance(fromAccount);

  useEffect(() => {
    if (!isOpen) return;

    const preferred = activeAccounts.find((a) => a._id === defaultFromAccount) || activeAccounts[0];
    setFromAccount(preferred?._id ?? '');
    setToAccount('');
    setAmount('');
    setStep('form');
    setResult(null);
    idempotencyRef.current = { key: '', details: '' };
    // Reset only when the modal opens; account list refetches must not wipe the form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultFromAccount]);

  // Amount in integer paise, or null while the input is not a valid rupee amount
  const paise = parseRupeesToPaise(amount);
  const amountError = !amount
    ? null
    : !paise
      ? 'Enter an amount greater than 0 with at most 2 decimal places.'
      : typeof available === 'number' && paise > available
        ? `That is more than the ${formatCurrency(available)} available in this account.`
        : null;

  const recipientOk =
    ACCOUNT_ID_PATTERN.test(recipientId) &&
    recipientId !== fromAccount &&
    lookup.data?.status === 'ACTIVE';

  const canContinue = Boolean(fromAccount) && recipientOk && Boolean(amount) && !amountError && !balanceLoading;

  const handleContinue = (e) => {
    e.preventDefault();
    if (!canContinue) return;

    const details = `${fromAccount}|${recipientId}|${paise}`;
    if (idempotencyRef.current.details !== details) {
      idempotencyRef.current = { key: generateIdempotencyKey(), details };
    }
    setStep('review');
  };

  const handleConfirm = async () => {
    try {
      const res = await transfer.mutateAsync({
        fromAccount,
        toAccount: recipientId,
        amount: paise,
        idempotencyKey: idempotencyRef.current.key,
      });
      setResult(res);
      setStep('done');
    } catch (err) {
      showError(err.message || 'Transfer failed. Please try again.');
    }
  };

  const recipientName = lookup.data?.isOwnAccount ? 'Your account' : lookup.data?.ownerName;
  const titles = { form: 'Transfer funds', review: 'Review transfer', done: 'Transfer complete' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titles[step]}>
      {step === 'form' && (
        <form onSubmit={handleContinue} className="space-y-4">
          {activeAccounts.length === 0 ? (
            <p className="text-muted">You need an active account to send money. New accounts become active once an admin approves them.</p>
          ) : (
            <>
              <div>
                <Select label="From account" value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} required>
                  {activeAccounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {accountLabel(acc._id)}
                    </option>
                  ))}
                </Select>
                <p className="text-[13px] text-subtle mt-1.5 tabular-nums">
                  Available: {balanceLoading ? '…' : formatCurrency(available)}
                </p>
              </div>

              <div>
                <Input
                  label="To account ID"
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  placeholder="24-character account ID"
                  autoComplete="off"
                  spellCheck={false}
                  mono
                  required
                />
                <RecipientStatus toAccount={recipientId} fromAccount={fromAccount} lookup={lookup} />
              </div>

              <div>
                <Input
                  label="Amount"
                  prefix="₹"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.trim())}
                  placeholder="0.00"
                  className="tabular-nums"
                  aria-invalid={Boolean(amountError)}
                  required
                />
                {amountError && <StatusLine ok={false}>{amountError}</StatusLine>}
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            {activeAccounts.length > 0 && (
              <Button type="submit" disabled={!canContinue}>
                Continue
              </Button>
            )}
          </div>
        </form>
      )}

      {step === 'review' && (
        <div className="space-y-5">
          <div className="text-center py-2">
            <div className="text-[13px] text-muted">You are sending</div>
            <div className="text-[34px] font-bold tracking-tight tabular-nums text-fg mt-1">{formatCurrency(paise)}</div>
          </div>

          <div className="rounded-control border border-border px-4">
            <SummaryRow label="From">{accountLabel(fromAccount)}</SummaryRow>
            <SummaryRow label="To">
              <span className="font-semibold">{recipientName}</span>
              <span className="block font-mono text-xs text-subtle mt-0.5">{recipientId}</span>
            </SummaryRow>
            <SummaryRow label="Recorded as">
              <span className="text-muted">1 debit + 1 credit entry</span>
            </SummaryRow>
          </div>

          <div className="flex items-center justify-between gap-2.5">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep('form')} disabled={transfer.isPending}>
              Back
            </Button>
            <Button icon={Send} onClick={handleConfirm} loading={transfer.isPending} loadingText="Sending...">
              Confirm transfer
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-5">
          <div className="text-center py-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-accent-soft text-accent-fg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="text-[30px] font-bold tracking-tight tabular-nums text-fg mt-3">{formatCurrency(paise)}</div>
            <p className="text-muted mt-1">
              sent to <span className="font-semibold text-fg">{recipientName}</span>
            </p>
          </div>

          <div className="rounded-control border border-border px-4">
            <SummaryRow label="From">{accountLabel(fromAccount)}</SummaryRow>
            <SummaryRow label="To">{shortId(recipientId)}</SummaryRow>
            {result?.transaction?._id && (
              <SummaryRow label="Transaction ID">
                <span className="font-mono text-xs">{result.transaction._id}</span>
              </SummaryRow>
            )}
            {result?.message && !result?.transaction && (
              <SummaryRow label="Status">{result.message}</SummaryRow>
            )}
          </div>

          <Button fullWidth onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
};
