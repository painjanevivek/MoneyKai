import { isSmsResearchBuildEnabled } from '@/config/environment';
import { discoverRecentNativeSmsAccounts, importRecentNativeSmsTransactions } from '@/services/nativeCaptureBridge';
import { identifyCaptureAccount } from '@/services/captureAccountIdentifier';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import type { CaptureIngestionResult, CaptureSignalInput } from '@/types/capture';

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

export const importRecentSmsTransactionsFromInbox = async (): Promise<SmsInboxImportSummary> => {
  if (!isSmsResearchBuildEnabled()) {
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
      message: 'sms research build is disabled',
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

  const accountPreview = await discoverRecentNativeSmsAccounts({ days: 30, maxMessages: 300 });
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

  if (accountDiscovery.pendingCount > 0) {
    return {
      ...summary,
      status: 'needs_account_approval',
      message: 'Approve the found bank accounts in Notifications before importing their SMS transactions.',
    };
  }

  const approvedAccountIds = accountPreview.signals
    .filter((signal) => captureStore.isSignalAccountApproved(signal))
    .map(identifyCaptureAccount)
    .filter((identity): identity is NonNullable<ReturnType<typeof identifyCaptureAccount>> => Boolean(identity))
    .map((identity) => identity.id);

  if (approvedAccountIds.length === 0) {
    return {
      ...summary,
      status: 'needs_account_approval',
      message: 'Approve at least one bank account before importing SMS transactions.',
    };
  }

  const nativeResult = await importRecentNativeSmsTransactions({
    days: 30,
    maxMessages: 300,
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

    if (draft?.category && latestCaptureStore.confirmDraft(draft.id, draft.category)) {
      summary.confirmedCount += 1;
    } else {
      summary.pendingReviewCount += 1;
    }
  });

  return summary;
};
