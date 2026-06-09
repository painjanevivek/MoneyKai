import { isSmsResearchBuildEnabled } from '@/config/environment';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import type { CaptureIngestionResult, CaptureSignalInput } from '@/types/capture';

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
