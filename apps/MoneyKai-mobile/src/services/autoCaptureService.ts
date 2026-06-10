import { isSmsResearchBuildEnabled } from '@/config/environment';
import { importRecentNativeSmsTransactions } from '@/services/nativeCaptureBridge';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import type { CaptureIngestionResult, CaptureSignalInput } from '@/types/capture';

export interface SmsInboxImportSummary {
  status: 'imported' | 'permission_denied' | 'unsupported' | 'error' | 'ignored';
  scannedCount: number;
  nativeImportedCount: number;
  nativeIgnoredCount: number;
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
      draftedCount: 0,
      confirmedCount: 0,
      duplicateCount: 0,
      pendingReviewCount: 0,
      parserIgnoredCount: 0,
      message: 'set a monthly budget before fetching transactions',
    };
  }

  const nativeResult = await importRecentNativeSmsTransactions({ days: 30, maxMessages: 300 });
  const summary: SmsInboxImportSummary = {
    status: nativeResult.status,
    scannedCount: nativeResult.scannedCount,
    nativeImportedCount: nativeResult.importedCount,
    nativeIgnoredCount: nativeResult.ignoredCount,
    draftedCount: 0,
    confirmedCount: 0,
    duplicateCount: 0,
    pendingReviewCount: 0,
    parserIgnoredCount: 0,
    message: nativeResult.message,
  };

  if (nativeResult.status !== 'imported') {
    return summary;
  }

  nativeResult.signals.forEach((signal) => {
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
    const captureStore = useCaptureStore.getState();
    const draft = captureStore.drafts.find((item) => item.id === result.draftId);

    if (draft?.category && captureStore.confirmDraft(draft.id, draft.category)) {
      summary.confirmedCount += 1;
    } else {
      summary.pendingReviewCount += 1;
    }
  });

  return summary;
};
