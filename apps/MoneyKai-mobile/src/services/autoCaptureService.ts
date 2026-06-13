import { isNativeSmsResearchBuildEnabled, isSmsResearchBuildEnabled } from '@/config/environment';
import { DEFAULT_SMS_IMPORT_RANGE_ID, getSmsImportRangeOption } from '@/constants/smsImportRanges';
import { discoverRecentNativeSmsAccounts, importRecentNativeSmsTransactions } from '@/services/nativeCaptureBridge';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import type { CaptureIngestionResult, CaptureSignalInput } from '@/types/capture';
import type { SmsImportProgress, SmsImportRangeId } from '@/types/smsImport';

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
  accountsSkippedCount: number;
  message?: string;
}

const emptySmsInboxImportSummary = (
  status: SmsInboxImportSummary['status'],
  message?: string
): SmsInboxImportSummary => ({
  status,
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
  accountsSkippedCount: 0,
  message,
});

const yieldToUi = () => new Promise((resolve) => setTimeout(resolve, 0));
const JS_INGESTION_BATCH_SIZE = 25;

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
  rangeId?: SmsImportRangeId,
  onProgress?: (progress: SmsImportProgress) => void
): Promise<SmsInboxImportSummary> => {
  if (!isNativeSmsResearchBuildEnabled()) {
    return emptySmsInboxImportSummary(
      'ignored',
      'SMS inbox import is only available in internal native SMS research builds.'
    );
  }

  if (useBudgetStore.getState().settings.monthly_allowance <= 0) {
    return emptySmsInboxImportSummary('ignored', 'set a monthly budget before fetching transactions');
  }

  const selectedRangeId = rangeId ?? useCaptureStore.getState().settings.smsImportRangeId ?? DEFAULT_SMS_IMPORT_RANGE_ID;
  const range = getSmsImportRangeOption(selectedRangeId);
  const summary: SmsInboxImportSummary = {
    ...emptySmsInboxImportSummary('imported'),
    status: 'imported',
  };

  let discoveryCursor: string | undefined;
  let discoveryPageCount = 0;
  let discoveryScannedCount = 0;
  do {
    discoveryPageCount += 1;
    const accountPreview = await discoverRecentNativeSmsAccounts({
      rangeId: range.id,
      days: range.days,
      maxMessages: range.maxMessages,
      pageSize: range.pageSize,
      cursor: discoveryCursor,
    });

    summary.status = accountPreview.status;
    summary.scannedCount += accountPreview.scannedCount;
    discoveryScannedCount += accountPreview.scannedCount;
    summary.nativeIgnoredCount += accountPreview.ignoredCount;
    summary.message = accountPreview.message;

    if (accountPreview.status !== 'imported') {
      return summary;
    }

    const captureStore = useCaptureStore.getState();
    const accountDiscovery = captureStore.discoverSmsAccounts(accountPreview.signals);
    summary.discoveredAccountCount += accountDiscovery.discoveredCount;
    summary.pendingAccountApprovalCount += accountDiscovery.pendingCount;
    summary.approvedAccountCount += accountDiscovery.approvedCount;
    summary.declinedAccountCount += accountDiscovery.declinedCount;

    onProgress?.({
      phase: 'discovering_accounts',
      scannedCount: summary.scannedCount,
      eligibleCount: summary.discoveredAccountCount,
      draftedCount: summary.draftedCount,
      duplicateCount: summary.duplicateCount,
      parserIgnoredCount: summary.parserIgnoredCount,
      pageCount: discoveryPageCount,
      message: `Scanning ${range.label} for bank accounts`,
    });

    discoveryCursor =
      accountPreview.hasMore && discoveryScannedCount < range.maxMessages ? accountPreview.nextCursor : undefined;
    await yieldToUi();
  } while (discoveryCursor);

  const captureStore = useCaptureStore.getState();
  const currentAccounts = captureStore.monitoredAccounts;
  summary.discoveredAccountCount = currentAccounts.length;
  summary.pendingAccountApprovalCount = currentAccounts.filter((account) => account.status === 'pending').length;
  summary.approvedAccountCount = currentAccounts.filter((account) => account.status === 'approved').length;
  summary.declinedAccountCount = currentAccounts.filter((account) => account.status === 'declined').length;
  summary.accountsSkippedCount = currentAccounts.filter((account) => account.status === 'declined' || account.status === 'paused').length;

  if (summary.pendingAccountApprovalCount > 0) {
    return {
      ...summary,
      status: 'needs_account_approval',
      message: 'Approve the found bank accounts in Notifications before importing their SMS transactions.',
    };
  }

  const approvedAccountIds = captureStore.getApprovedSmsAccountIds();

  if (approvedAccountIds.length === 0) {
    return {
      ...summary,
      status: 'needs_account_approval',
      message: 'Approve at least one bank account before importing SMS transactions.',
    };
  }

  let importCursor: string | undefined;
  let importPageCount = 0;
  let importScannedCount = 0;
  do {
    importPageCount += 1;
    const nativeResult = await importRecentNativeSmsTransactions({
      rangeId: range.id,
      days: range.days,
      maxMessages: range.maxMessages,
      pageSize: range.pageSize,
      cursor: importCursor,
      approvedAccountIds,
    });

    summary.status = nativeResult.status;
    summary.scannedCount += nativeResult.scannedCount;
    importScannedCount += nativeResult.scannedCount;
    summary.nativeImportedCount += nativeResult.importedCount;
    summary.nativeIgnoredCount += nativeResult.ignoredCount;
    summary.message = nativeResult.message;

    if (nativeResult.status !== 'imported') {
      return summary;
    }

    const approvedSignals = nativeResult.signals.filter((signal) => useCaptureStore.getState().isSignalAccountApproved(signal));
    for (let index = 0; index < approvedSignals.length; index += 1) {
      const signal = approvedSignals[index];
      const result = ingestCapturedTransactionSignal(signal);

      if (result.status === 'duplicate') {
        summary.duplicateCount += 1;
      } else if (result.status === 'ignored') {
        summary.parserIgnoredCount += 1;
      } else if (result.status === 'drafted' && result.draftId) {
        summary.draftedCount += 1;
        summary.pendingReviewCount += 1;
      }

      if ((index + 1) % JS_INGESTION_BATCH_SIZE === 0) {
        onProgress?.({
          phase: 'importing_transactions',
          scannedCount: summary.scannedCount,
          eligibleCount: summary.nativeImportedCount,
          draftedCount: summary.draftedCount,
          duplicateCount: summary.duplicateCount,
          parserIgnoredCount: summary.parserIgnoredCount,
          pageCount: importPageCount,
          message: `Reviewing SMS batch ${index + 1} of ${approvedSignals.length}`,
        });
        await yieldToUi();
      }
    }

    onProgress?.({
      phase: 'importing_transactions',
      scannedCount: summary.scannedCount,
      eligibleCount: summary.nativeImportedCount,
      draftedCount: summary.draftedCount,
      duplicateCount: summary.duplicateCount,
      parserIgnoredCount: summary.parserIgnoredCount,
      pageCount: importPageCount,
      message: `Importing ${range.label} SMS transactions`,
    });

    importCursor =
      nativeResult.hasMore && importScannedCount < range.maxMessages ? nativeResult.nextCursor : undefined;
    await yieldToUi();
  } while (importCursor);

  onProgress?.({
    phase: 'complete',
    scannedCount: summary.scannedCount,
    eligibleCount: summary.nativeImportedCount,
    draftedCount: summary.draftedCount,
    duplicateCount: summary.duplicateCount,
    parserIgnoredCount: summary.parserIgnoredCount,
    pageCount: importPageCount,
    message: 'SMS import complete',
  });

  return summary;
};
