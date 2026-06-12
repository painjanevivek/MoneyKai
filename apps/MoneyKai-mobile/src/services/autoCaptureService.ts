import { isNativeSmsResearchBuildEnabled, isSmsResearchBuildEnabled } from '@/config/environment';
import { discoverRecentNativeSmsAccounts, importRecentNativeSmsTransactions } from '@/services/nativeCaptureBridge';
import { identifyCaptureAccount } from '@/services/captureAccountIdentifier';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import type { CaptureIngestionResult, CaptureSignalInput } from '@/types/capture';

export type SmsImportRangeId = '15d' | '1m' | '3m' | '6m' | '1y' | 'all';

export const SMS_IMPORT_RANGES: Array<{ id: SmsImportRangeId; label: string; days: number; maxMessages: number }> = [
  { id: '15d', label: '15 days', days: 15, maxMessages: 500 },
  { id: '1m', label: '1 month', days: 30, maxMessages: 1000 },
  { id: '3m', label: '3 months', days: 90, maxMessages: 3000 },
  { id: '6m', label: '6 months', days: 180, maxMessages: 6000 },
  { id: '1y', label: '1 year', days: 365, maxMessages: 12000 },
  { id: 'all', label: 'ALL', days: 0, maxMessages: 50000 },
];

const getSmsImportRange = (rangeId: SmsImportRangeId = '1m') =>
  SMS_IMPORT_RANGES.find((range) => range.id === rangeId) ?? SMS_IMPORT_RANGES[1];

export interface SmsInboxImportSummary {
  status: 'imported' | 'needs_account_approval' | 'permission_denied' | 'unsupported' | 'error' | 'ignored';
  scannedCount: number;
  nativeImportedCount: number;
  nativeIgnoredCount: number;
  discoveredAccountCount: number;
  pendingAccountApprovalCount: number;
  approvedAccountCount: number;
  declinedAccountCount: number;
  draftedCount: number;
  confirmedCount: number;
  duplicateCount: number;
  pendingReviewCount: number;
  parserIgnoredCount: number;
  message?: string;
}

export const ingestCapturedTransactionSignal = (input: CaptureSignalInput): CaptureIngestionResult => {
  if (useBudgetStore.getState().settings.monthly_allowance <= 0) {
    return { status: 'ignored', reason: 'set a monthly budget before fetching transactions' };
  }

  return useCaptureStore.getState().ingestSignal(input);
};

export const ingestNotificationCapture = (params: {
  title?: string;
  body: string;
  sourceApp?: string;
  receivedAt?: string;
  rawPayload?: Record<string, unknown>;
}): CaptureIngestionResult =>
  ingestCapturedTransactionSignal({
    source: 'notification',
    title: params.title,
    body: params.body,
    sourceApp: params.sourceApp,
    receivedAt: params.receivedAt,
    rawPayload: params.rawPayload,
  });

export const ingestSmsCapture = (params: {
  sender?: string;
  body: string;
  receivedAt?: string;
}): CaptureIngestionResult => {
  if (!isSmsResearchBuildEnabled()) {
    return { status: 'ignored', reason: 'sms research build is disabled' };
  }

  return ingestCapturedTransactionSignal({
    source: 'sms',
    sender: params.sender,
    body: params.body,
    receivedAt: params.receivedAt,
  });
};

export const importRecentSmsTransactionsFromInbox = async (
  rangeId: SmsImportRangeId = '1m'
): Promise<SmsInboxImportSummary> => {
  if (!isNativeSmsResearchBuildEnabled()) {
    return {
      status: 'ignored',
      scannedCount: 0,
      nativeImportedCount: 0,
      nativeIgnoredCount: 0,
      discoveredAccountCount: 0,
      pendingAccountApprovalCount: 0,
      approvedAccountCount: 0,
      declinedAccountCount: 0,
      draftedCount: 0,
      confirmedCount: 0,
      duplicateCount: 0,
      pendingReviewCount: 0,
      parserIgnoredCount: 0,
      message: 'SMS inbox import is only available in internal native SMS research builds.',
    };
  }

  if (useBudgetStore.getState().settings.monthly_allowance <= 0) {
    return {
      status: 'ignored',
      scannedCount: 0,
      nativeImportedCount: 0,
      nativeIgnoredCount: 0,
      discoveredAccountCount: 0,
      pendingAccountApprovalCount: 0,
      approvedAccountCount: 0,
      declinedAccountCount: 0,
      draftedCount: 0,
      confirmedCount: 0,
      duplicateCount: 0,
      pendingReviewCount: 0,
      parserIgnoredCount: 0,
      message: 'set a monthly budget before fetching transactions',
    };
  }

  const range = getSmsImportRange(rangeId);
  const accountPreview = await discoverRecentNativeSmsAccounts({
    days: range.days,
    maxMessages: range.maxMessages,
  });
  const summary: SmsInboxImportSummary = {
    status: accountPreview.status,
    scannedCount: accountPreview.scannedCount,
    nativeImportedCount: 0,
    nativeIgnoredCount: accountPreview.ignoredCount,
    discoveredAccountCount: 0,
    pendingAccountApprovalCount: 0,
    approvedAccountCount: 0,
    declinedAccountCount: 0,
    draftedCount: 0,
    confirmedCount: 0,
    duplicateCount: 0,
    pendingReviewCount: 0,
    parserIgnoredCount: 0,
    message: accountPreview.message,
  };

  if (accountPreview.status !== 'imported') {
    return summary;
  }

  const captureStore = useCaptureStore.getState();
  const accountDiscovery = captureStore.discoverSmsAccounts(accountPreview.signals);
  summary.discoveredAccountCount = accountDiscovery.discoveredCount;
  summary.pendingAccountApprovalCount = accountDiscovery.pendingCount;
  summary.approvedAccountCount = accountDiscovery.approvedCount;
  summary.declinedAccountCount = accountDiscovery.declinedCount;

  const approvedAccountIds = accountPreview.signals
    .filter((signal) => captureStore.isSignalAccountApproved(signal))
    .map(identifyCaptureAccount)
    .filter((identity): identity is NonNullable<ReturnType<typeof identifyCaptureAccount>> => Boolean(identity))
    .map((identity) => identity.id);

  if (approvedAccountIds.length === 0 && accountDiscovery.pendingCount > 0) {
    return {
      ...summary,
      status: 'needs_account_approval',
      message: 'Approve the found bank accounts in Notifications before importing their SMS transactions.',
    };
  }

  if (approvedAccountIds.length === 0) {
    return {
      ...summary,
      status: 'needs_account_approval',
      message: 'Approve at least one bank account before importing SMS transactions.',
    };
  }

  const nativeResult = await importRecentNativeSmsTransactions({
    days: range.days,
    maxMessages: range.maxMessages,
    approvedAccountIds,
  });
  summary.status = nativeResult.status;
  summary.scannedCount = nativeResult.scannedCount;
  summary.nativeImportedCount = nativeResult.importedCount;
  summary.nativeIgnoredCount = nativeResult.ignoredCount;
  summary.message = nativeResult.message;

  if (nativeResult.status !== 'imported') {
    return summary;
  }

  nativeResult.signals.filter((signal) => captureStore.isSignalAccountApproved(signal)).forEach((signal) => {
    const result = ingestCapturedTransactionSignal(signal);

    if (result.status === 'duplicate') {
      summary.duplicateCount += 1;
      return;
    }

    if (result.status === 'ignored') {
      summary.parserIgnoredCount += 1;
      return;
    }

    if (result.status !== 'drafted' || !result.draftId) {
      return;
    }

    summary.draftedCount += 1;
    const latestCaptureStore = useCaptureStore.getState();
    const draft = latestCaptureStore.drafts.find((item) => item.id === result.draftId);

    if (draft) {
      summary.pendingReviewCount += 1;
    }
  });

  return summary;
};
