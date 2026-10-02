import { isNativeSmsResearchBuildEnabled, isSmsResearchBuildEnabled } from '@/config/environment';
import { DEFAULT_SMS_IMPORT_RANGE_ID, getSmsImportRangeOption } from '@/constants/smsImportRanges';
import { discoverRecentNativeSmsAccounts, importRecentNativeSmsTransactions } from '@/services/nativeCaptureBridge';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import type { CaptureIngestionResult, CaptureSignalInput } from '@/types/capture';
import type { SmsImportProgress, SmsImportRangeId } from '@/types/smsImport';
import { useAuthStore } from '@/stores/useAuthStore';
import { hasCurrentSmsConsent } from '@/constants/smsConsent';

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

/** Native background discovery is metadata, not a transaction to send to the parser. */
export const ingestNativeCaptureSignal = (input: CaptureSignalInput): CaptureIngestionResult => {
  if (input.source === 'sms') {
    const owner = useAuthStore.getState().user?.id;
    const store = useCaptureStore.getState();
    const { settings } = store;
    if (!isNativeSmsResearchBuildEnabled() || !settings.autoCaptureEnabled || !settings.smsResearchModeEnabled || !hasCurrentSmsConsent(settings, owner) || useBudgetStore.getState().settings.monthly_allowance <= 0 || (input.rawPayload?.smsOwnerId && input.rawPayload.smsOwnerId !== owner)) {
      return { status: 'ignored', reason: 'SMS reading is off or consent is not current' };
    }
    if (input.rawPayload?.captureOrigin === 'android_sms_account_discovery') {
      store.discoverSmsAccounts([input]);
      return { status: 'ignored', reason: 'sms bank account monitoring needs approval' };
    }
  }
  return ingestCapturedTransactionSignal(input);
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
  onProgress?: (progress: SmsImportProgress) => void,
  isScanCurrent: () => boolean = () => true
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
  const owner = useAuthStore.getState().user?.id;
  const canContinue = () => {
    const { settings } = useCaptureStore.getState();
    return Boolean(isScanCurrent() && owner && owner === useAuthStore.getState().user?.id && settings.autoCaptureEnabled && settings.smsResearchModeEnabled && hasCurrentSmsConsent(settings, owner) && useBudgetStore.getState().settings.monthly_allowance > 0);
  };
  if (!canContinue()) return emptySmsInboxImportSummary('ignored', 'Turn on SMS reading and accept the disclosure before checking messages.');
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
    if (!canContinue()) return { ...summary, status: 'ignored', message: 'Message check stopped.' };
    const accountPreview = await discoverRecentNativeSmsAccounts({
      rangeId: range.id,
      days: range.days,
      maxMessages: range.maxMessages,
      pageSize: Math.min(range.pageSize, range.maxMessages - discoveryScannedCount),
      cursor: discoveryCursor,
    });

    if (!canContinue()) return { ...summary, status: 'ignored', message: 'Message check stopped.' };
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

  const approvedAccountIds = captureStore.getApprovedSmsAccountIds();
  if (summary.pendingAccountApprovalCount > 0 && approvedAccountIds.length === 0) {
    return {
      ...summary,
      status: 'needs_account_approval',
      message: 'Choose the found bank accounts in the review queue before importing their transactions.',
    };
  }

  if (approvedAccountIds.length === 0) {
    return {
      ...summary,
      status: 'imported',
      message: currentAccounts.length === 0
        ? 'No eligible bank transaction SMS found in the selected history. Try a wider import range.'
        : 'No bank accounts are selected. Select an account in Capture settings to import its transactions.',
    };
  }

  let importCursor: string | undefined;
  let importPageCount = 0;
  let importScannedCount = 0;
  do {
    importPageCount += 1;
    if (!canContinue()) return { ...summary, status: 'ignored', message: 'Message check stopped.' };
    const nativeResult = await importRecentNativeSmsTransactions({
      rangeId: range.id,
      days: range.days,
      maxMessages: range.maxMessages,
      pageSize: Math.min(range.pageSize, range.maxMessages - importScannedCount),
      cursor: importCursor,
      approvedAccountIds,
    });

    if (!canContinue()) return { ...summary, status: 'ignored', message: 'Message check stopped.' };
    summary.status = nativeResult.status;
    importScannedCount += nativeResult.scannedCount;
    // Discovery and parsing read the same rows; do not count both passes as extra SMS.
    summary.scannedCount = Math.max(discoveryScannedCount, importScannedCount);
    summary.nativeImportedCount += nativeResult.importedCount;
    summary.nativeIgnoredCount += nativeResult.ignoredCount;
    summary.message = nativeResult.message;

    if (nativeResult.status !== 'imported') {
      return summary;
    }

    const approvedSignals = nativeResult.signals.filter((signal) => useCaptureStore.getState().isSignalAccountApproved(signal));
    for (let index = 0; index < approvedSignals.length; index += 1) {
      if (!canContinue()) return { ...summary, status: 'ignored', message: 'Message check stopped.' };
      const signal = approvedSignals[index];
      const result = ingestCapturedTransactionSignal(signal);

      if (result.status === 'duplicate') {
        summary.duplicateCount += 1;
      } else if (result.status === 'ignored') {
        summary.parserIgnoredCount += 1;
      } else if (result.status === 'confirmed') {
        summary.confirmedCount += 1;
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
