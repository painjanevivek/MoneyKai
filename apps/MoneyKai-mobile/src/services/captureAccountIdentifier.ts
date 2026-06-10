import type { CaptureSignalInput, MonitoredAccount } from '@/types/capture';

export interface CaptureAccountIdentity {
  id: string;
  source: 'sms';
  bankKey: string;
  bankLabel: string;
  accountHint?: string;
  sender?: string;
}

const BANK_LABELS: Record<string, string> = {
  axisbk: 'Axis Bank',
  cbssbi: 'SBI',
  sbipsg: 'SBI',
  sbiupi: 'SBI UPI',
  sbi: 'SBI',
  hdfcbk: 'HDFC Bank',
  icicib: 'ICICI Bank',
  kotak: 'Kotak Bank',
  yesbnk: 'YES Bank',
  idfc: 'IDFC Bank',
  indus: 'IndusInd Bank',
  federal: 'Federal Bank',
};

const normalizeSender = (value?: string) => value?.trim().toUpperCase() ?? '';

const deriveBankKey = (sender?: string) => {
  const normalized = normalizeSender(sender);
  const senderCore = normalized.match(/^[A-Z]{2}-([A-Z0-9]{3,12})(?:-[A-Z])?$/)?.[1] ?? normalized;
  return senderCore.replace(/[^A-Z0-9]/g, '').toLowerCase();
};

const deriveBankLabel = (bankKey: string, sender?: string) => {
  if (BANK_LABELS[bankKey]) return BANK_LABELS[bankKey];
  const normalized = normalizeSender(sender);
  return normalized || bankKey.toUpperCase() || 'Bank account';
};

const readSafePayloadString = (input: CaptureSignalInput, key: string) => {
  const value = input.rawPayload?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const extractAccountHintFromText = (text: string) => {
  const accountMatch =
    text.match(/\b(?:a\/c|account|acct)\s*(?:no\.?|number)?\s*(?:ending\s*)?(?:x{1,}|xx)?\s*(\d{3,6})\b/i) ??
    text.match(/\b(?:x{1,}|xx)(\d{3,6})\b/i);
  return accountMatch?.[1] ? `ending ${accountMatch[1].slice(-4)}` : undefined;
};

export const identifyCaptureAccount = (input: CaptureSignalInput): CaptureAccountIdentity | undefined => {
  if (input.source !== 'sms') return undefined;

  const sender = input.sender ?? input.sourceApp;
  const bankKey = deriveBankKey(sender);
  if (!bankKey) return undefined;

  const payloadHint = readSafePayloadString(input, 'smsAccountHint');
  const accountHint = payloadHint ?? extractAccountHintFromText(input.body);
  const accountKeyPart = accountHint?.replace(/[^a-z0-9]+/gi, '').toLowerCase() || 'sender';
  const bankLabel = deriveBankLabel(bankKey, sender);

  return {
    id: `sms:${bankKey}:${accountKeyPart}`,
    source: 'sms',
    bankKey,
    bankLabel,
    accountHint,
    sender,
  };
};

export const buildMonitoredAccount = (
  identity: CaptureAccountIdentity,
  now: string
): MonitoredAccount => ({
  id: identity.id,
  source: identity.source,
  bankKey: identity.bankKey,
  bankLabel: identity.bankLabel,
  accountHint: identity.accountHint,
  sender: identity.sender,
  status: 'pending',
  sampleCount: 1,
  firstSeenAt: now,
  lastSeenAt: now,
});

const normalizeAccountHint = (value?: string) => value?.replace(/[^a-z0-9]+/gi, '').toLowerCase();

const normalizeAccountBankLabel = (value?: string) => value?.toLowerCase().replace(/\b(?:bank|upi)\b/g, '').replace(/[^a-z0-9]+/g, '');

export const isMatchingCaptureAccount = (account: MonitoredAccount, identity: CaptureAccountIdentity) => {
  if (account.id === identity.id) return true;
  if (account.source !== identity.source) return false;

  const sameHint = Boolean(account.accountHint && identity.accountHint && normalizeAccountHint(account.accountHint) === normalizeAccountHint(identity.accountHint));
  const sameBankKey = account.bankKey === identity.bankKey;
  const sameBankLabel = normalizeAccountBankLabel(account.bankLabel) === normalizeAccountBankLabel(identity.bankLabel);
  const sameSender = Boolean(account.sender && identity.sender && normalizeSender(account.sender) === normalizeSender(identity.sender));

  if (sameHint && (sameBankKey || sameBankLabel)) return true;
  if (!account.accountHint || !identity.accountHint) return sameBankKey && sameSender;

  return false;
};

export const findMatchingCaptureAccount = (
  accounts: MonitoredAccount[],
  identity: CaptureAccountIdentity,
  statuses?: MonitoredAccount['status'][]
) =>
  accounts.find((account) => {
    if (statuses && !statuses.includes(account.status)) return false;
    return isMatchingCaptureAccount(account, identity);
  });

export const formatMonitoredAccountLabel = (account: Pick<MonitoredAccount, 'bankLabel' | 'accountHint' | 'sender'>) =>
  account.accountHint
    ? `${account.bankLabel} - A/c ${account.accountHint}`
    : `${account.bankLabel}${account.sender ? ` - ${account.sender}` : ''}`;
