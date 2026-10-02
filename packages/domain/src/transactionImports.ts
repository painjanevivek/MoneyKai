/** Public approved-SMS DTOs. No raw inbox content belongs in this contract. */
export const SMS_SYNC_CONSENT_VERSION = 'sms-approved-sync-v1' as const;
export const SMS_PARSER_VERSION = 'sms-offline-v1' as const;
export const IMPORT_BATCH_LIMIT = 50;
export type SyncConsent = { enabled: boolean; version: typeof SMS_SYNC_CONSENT_VERSION; revision: number; updatedAt?: string | null };
export type SyncAvailability = { status: 'available' | 'disabled_unverified' | 'paused_free_quota' | 'paused_storage' | 'coordination_unavailable'; retryAt?: string | null; reason?: string | null };
export type ImportProgress = { scanned: number; parsed: number; duplicates: number; review: number; awaitingSync: number; synced: number };
export type ImportJob = { id: string; clientJobId: string; parserVersion: string; consentRevision: number; state: 'importing' | 'paused' | 'cancelled' | 'completed' | 'failed'; progress: ImportProgress; availability: SyncAvailability };
export type ApprovedSmsTransaction = {
  id: string; importIdentity: string; accountIdentity: string; amountMinor: number; amount?: number; currency: 'INR';
  type: 'income' | 'expense'; semantics: 'payment' | 'refund' | 'reversal' | 'transfer'; category: string;
  description: string; payment_method: string; transaction_date: string; parserVersion: typeof SMS_PARSER_VERSION;
  reviewStatus: 'approved'; captureSource: 'sms'; expectedRevision: number;
};
export type ApprovedTransactionBatch = { consentRevision: number; idempotencyKey: string; transactions: ApprovedSmsTransaction[] };
export type BatchReceipt = { id: string; jobId: string; fingerprint: string; accepted: string[]; duplicates: string[]; conflicts: string[]; revisions: Record<string, number>; committedAt: string; availability: SyncAvailability };

/** Convert without rounding fractional paise or relying on binary float multiplication. */
export function amountToMinor(amount: number | string): number {
  const value = String(amount);
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error('Amount must contain exact paise');
  const [rupees, fraction = ''] = value.split('.');
  const result = Number(rupees) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || result <= 0 || result > 100_000_000_000_000) throw new Error('Amount outside supported range');
  return result;
}
