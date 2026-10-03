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
  description: string; nickname?:string|null; payment_method: string; transaction_date: string; parserVersion: typeof SMS_PARSER_VERSION;
  reviewStatus: 'approved'; captureSource: 'sms'; expectedRevision: number;
};
export type ApprovedTransactionBatch = { consentRevision: number; idempotencyKey: string; transactions: ApprovedSmsTransaction[] };
export type BatchReceipt = { id: string; jobId: string; fingerprint: string; accepted: string[]; duplicates: string[]; conflicts: string[]; revisions: Record<string, number>; committedAt: string; availability: SyncAvailability };
export type ApprovedDeletionBatch = { idempotencyKey: string; identities: string[] };
export type DeletionReceipt = { id: string; deleted: string[]; committedAt: string };

const approvedKeys = new Set(['id','importIdentity','accountIdentity','amountMinor','amount','currency','type','semantics','category','description','nickname','payment_method','transaction_date','parserVersion','reviewStatus','captureSource','expectedRevision']);
export function normalizeTransactionNickname(value:string):string {
  if(typeof value!=='string' || Array.from(value).length>100 || /[\u0000-\u0008\u000e-\u001f]/.test(value))throw new Error('Invalid nickname');
  return value.trim().replace(/\s+/g,' ');
}
export function savedTransactionLabel(row:{nickname?:string|null;description:string}):string {
  return row.nickname?.trim() || row.description;
}
const utf8Bytes = (value:string) => { let size=0; for(const character of value) { const code=character.codePointAt(0)!; size += code < 128 ? 1 : code < 2048 ? 2 : code < 65536 ? 3 : 4; } return size; };
/** Runtime egress validation. Extra private fields fail closed even on this route. */
export function assertApprovedSmsBatch(value: unknown): asserts value is ApprovedTransactionBatch {
  const batch = value as ApprovedTransactionBatch;
  if (!batch || typeof batch !== 'object' || Object.keys(batch).some(key => !['consentRevision','idempotencyKey','transactions'].includes(key)) ||
      !Number.isSafeInteger(batch.consentRevision) || batch.consentRevision < 1 || !/^[a-zA-Z0-9_-]{1,80}$/.test(batch.idempotencyKey) ||
      !Array.isArray(batch.transactions) || batch.transactions.length < 1 || batch.transactions.length > 50 || utf8Bytes(JSON.stringify(batch)) > 65536) throw new Error('Invalid approved SMS batch');
  const identities = new Set<string>(); const ids = new Set<string>();
  for (const row of batch.transactions) {
    if(row?.nickname!=null)normalizeTransactionNickname(row.nickname);
    if (!row || typeof row !== 'object' || Object.keys(row).some(key => !approvedKeys.has(key)) ||
        row.captureSource !== 'sms' || row.reviewStatus !== 'approved' || row.parserVersion !== SMS_PARSER_VERSION || row.currency !== 'INR' ||
        !/^[a-zA-Z0-9_-]{1,80}$/.test(row.id) || !/^[a-f0-9]{64}$/.test(row.importIdentity) || !/^[a-f0-9]{64}$/.test(row.accountIdentity) ||
        !Number.isSafeInteger(row.amountMinor) || row.amountMinor <= 0 || row.amountMinor > 100_000_000_000_000 ||
        (row.amount !== undefined && amountToMinor(row.amount) !== row.amountMinor) || !['income','expense'].includes(row.type) ||
        !['payment','refund','reversal','transfer'].includes(row.semantics) || !Number.isSafeInteger(row.expectedRevision) || row.expectedRevision < 0 ||
        typeof row.category !== 'string' || !row.category.trim() || row.category.length > 120 || typeof row.description !== 'string' || row.description.length > 120 ||
        typeof row.payment_method !== 'string' || row.payment_method.length > 80 || !/^\d{4}-\d{2}-\d{2}$/.test(row.transaction_date) ||
        identities.has(row.importIdentity) || ids.has(row.id)) throw new Error('Invalid approved SMS transaction');
    identities.add(row.importIdentity); ids.add(row.id);
  }
}
export function isCloudApprovedSmsTransaction(row: { captureSource?: unknown; reviewStatus?: unknown; importIdentity?: unknown; accountIdentity?: unknown; amountMinor?: unknown }): boolean {
  return row.captureSource === 'sms' && row.reviewStatus === 'approved' && typeof row.importIdentity === 'string' && /^[a-f0-9]{64}$/.test(row.importIdentity) &&
    typeof row.accountIdentity === 'string' && /^[a-f0-9]{64}$/.test(row.accountIdentity) && Number.isSafeInteger(row.amountMinor) && Number(row.amountMinor) > 0;
}

/** Convert without rounding fractional paise or relying on binary float multiplication. */
export function amountToMinor(amount: number | string): number {
  const value = String(amount);
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error('Amount must contain exact paise');
  const [rupees, fraction = ''] = value.split('.');
  const result = Number(rupees) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || result <= 0 || result > 100_000_000_000_000) throw new Error('Amount outside supported range');
  return result;
}
