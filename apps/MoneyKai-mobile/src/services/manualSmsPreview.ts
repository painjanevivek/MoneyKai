import { parseCapturedSignal } from './captureParser';
import { redactSensitiveSmsText } from './smsPrivacy';
import type { Transaction } from '@/types/transaction';
import { localDateKey } from '@/utils/purchaseTools';

export type ManualSmsPreview = Omit<Transaction, 'id' | 'created_at' | 'user_id'>;

/** Whitelist-only preview: never return or persist the original body or parser explanations. */
export function previewManualSms(body: string, now = new Date()): ManualSmsPreview | null {
  if (!body.trim() || body.length > 10000) return null;
  // This screen saves INR records. Never silently relabel another currency or a
  // scheduled/initiated payment as a completed rupee transaction.
  if (/\b(?:aed|usd|eur|gbp|sar|qar|omr|bhd|kwd)\b|[$€£]/i.test(body) ||
      /\b(?:will be (?:credited|debited)|initiated|once processed|scheduled|pending)\b/i.test(body)) return null;
  const input = { source: 'sms' as const, body, receivedAt: now.toISOString() };
  const parsed = parseCapturedSignal(input);
  if (parsed.parseStatus === 'ignore' || !parsed.amount || !Number.isFinite(parsed.amount) || !parsed.type) return null;
  const date = parsed.transactionDate ?? localDateKey(now);
  return {
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.category ?? (parsed.type === 'income' ? 'other_income' : 'others'),
    description: redactSensitiveSmsText(parsed.merchantLabel ?? 'Bank transaction'),
    counterpartyName: parsed.merchantLabel ? redactSensitiveSmsText(parsed.merchantLabel) : undefined,
    counterpartyKind: parsed.counterpartyKind,
    payment_method: parsed.paymentMethod ?? 'bank',
    transaction_date: date,
    captureSource: 'sms',
  };
}
