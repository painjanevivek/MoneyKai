import type { CaptureParseResult, CaptureSignalInput } from '@/types/capture';
import type { Transaction } from '@/types/transaction';

export interface CaptureDedupeKeys {
  sourceFingerprint: string;
  referenceKey?: string;
  canonicalTransactionKey: string;
  legacyDedupeKey: string;
}

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const normalizeDedupeText = (value?: string) =>
  normalizeWhitespace(value ?? '')
    .toLowerCase()
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\b/gi, '[vpa]')
    .replace(/\b(?:xx|x{2,})\d+\b/gi, '[masked]')
    .replace(/\b\d{8,}\b/g, '[number]')
    .replace(/[^a-z0-9 [\].-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeMerchant = (value?: string) =>
  normalizeDedupeText(value)
    .replace(/(?:upi|txn|transaction|ref|rrn|utr|id|no)\s*[:#-]?\s*[a-z0-9/-]+.*$/i, '')
    .replace(/\b(?:pvt|private|ltd|limited|india|upi|pay)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const stableHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const safeDateKey = (value?: string) => {
  const timestamp = new Date(value ?? Date.now()).getTime();
  const validTimestamp = Number.isFinite(timestamp) ? timestamp : Date.now();
  return new Date(validTimestamp).toISOString().split('T')[0];
};

const timeBucketKey = (value: string | undefined, minutes: number) => {
  const timestamp = new Date(value ?? Date.now()).getTime();
  const validTimestamp = Number.isFinite(timestamp) ? timestamp : Date.now();
  const bucketMs = minutes * 60 * 1000;
  return new Date(Math.floor(validTimestamp / bucketMs) * bucketMs).toISOString();
};

const readRawString = (input: CaptureSignalInput, key: string) => {
  const value = input.rawPayload?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

export const buildSourceFingerprint = (input: CaptureSignalInput) => {
  const notificationId = readRawString(input, 'notificationId');
  if (input.source === 'notification' && notificationId && /^[a-f0-9]{64}$/.test(notificationId)) {
    return ['notification', readRawString(input, 'rawPackageName'), notificationId].join(':');
  }
  const nativeMessageId = readRawString(input, 'smsMessageId');
  if (input.source === 'sms' && nativeMessageId) {
    return ['sms-message', normalizeDedupeText(input.sender), nativeMessageId].join(':');
  }

  const sourceName = normalizeDedupeText(input.sender ?? input.sourceApp ?? input.title ?? 'unknown');
  const receivedAt = new Date(input.receivedAt ?? Date.now());
  const receivedAtKey = Number.isFinite(receivedAt.getTime()) ? receivedAt.toISOString() : new Date().toISOString();
  const bodyHash = stableHash(normalizeDedupeText(input.body));
  return [input.source, sourceName, receivedAtKey, bodyHash].join(':');
};

export const buildReferenceKey = (parsed: CaptureParseResult) =>
  parsed.transactionReference && /\d/.test(parsed.transactionReference) && !/\[/.test(parsed.transactionReference)
    ? `ref:${parsed.transactionReference.toLowerCase().replace(/[^a-z0-9/-]/g, '')}`
    : undefined;

export const buildCanonicalTransactionKey = (
  input: CaptureSignalInput,
  parsed: CaptureParseResult,
  captureAccountId?: string
) => {
  const referenceHash = readRawString(input, input.source === 'sms' ? 'smsReferenceHash' : 'notificationReferenceHash');
  const referenceKey = referenceHash && /^[a-f0-9]{64}$/.test(referenceHash)
    ? `ref-hash:${referenceHash}` : buildReferenceKey(parsed);
  const amount = parsed.amount?.toFixed(2) ?? 'unknown';
  const type = parsed.type ?? 'unknown';
  const merchant = normalizeMerchant(parsed.merchantKey ?? parsed.merchantLabel ?? input.sender ?? input.sourceApp ?? 'unknown') || 'unknown';
  const accountScope = captureAccountId ?? (normalizeDedupeText(readRawString(input, 'smsAccountHint')) || 'unknown-account');

  // Native digests are computed before redaction. The bank and payment app can
  // describe the same payee differently; a shared reference, direction and
  // amount should still match across those sources.
  if (referenceHash && /^[a-f0-9]{64}$/.test(referenceHash)) {
    return ['txn', `ref-hash:${referenceHash}`, accountScope, 'INR', type, amount].join(':');
  }

  if (referenceKey) {
    return ['txn', referenceKey, accountScope, 'INR', type, amount].join(':');
  }

  // Payment apps may reuse a notification key for later payments. Without a
  // reference, do not discard a different event merely for sharing an amount.
  const notificationId = readRawString(input, 'notificationId');
  if (input.source === 'notification' && notificationId && /^[a-f0-9]{64}$/.test(notificationId)) {
    return ['txn', 'notification', notificationId, type, amount].join(':');
  }

  return ['txn', 'message', buildSourceFingerprint(input), accountScope, type, amount].join(':');
};

export const buildCaptureDedupeKeys = (
  input: CaptureSignalInput,
  parsed: CaptureParseResult,
  captureAccountId?: string
): CaptureDedupeKeys => {
  const sourceFingerprint = buildSourceFingerprint(input);
  const referenceKey = buildReferenceKey(parsed);
  const canonicalTransactionKey = buildCanonicalTransactionKey(input, parsed, captureAccountId);
  const legacyDedupeKey = [sourceFingerprint, canonicalTransactionKey].join('|');

  return {
    sourceFingerprint,
    referenceKey,
    canonicalTransactionKey,
    legacyDedupeKey,
  };
};

export const isDuplicateTransaction = (
  transaction: Omit<Transaction, 'id' | 'created_at'>,
  existingTransactions: Transaction[]
) => {
  const canonicalKey = transaction.canonicalTransactionKey;
  const sourceFingerprint = transaction.sourceFingerprint;

  return existingTransactions.some((existing) => {
    if (canonicalKey && existing.canonicalTransactionKey === canonicalKey) return true;
    if (sourceFingerprint && existing.sourceFingerprint === sourceFingerprint) return true;
    return false;
  });
};
