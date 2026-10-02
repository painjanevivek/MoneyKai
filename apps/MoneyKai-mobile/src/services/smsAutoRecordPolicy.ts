import type { CaptureParseResult, CaptureSignalInput } from '@/types/capture';
import { isAllowedTransactionDate } from '@/utils/calendarDates';
import { hasKnownIndianBankSignal } from '@/constants/indiaBankAliases';

export function isRecognizedBankSmsSender(sender: string) {
  const core = sender.trim().toUpperCase().replace(/^[A-Z]{2}-/, '').replace(/-[A-Z]$/, '');
  return /^(?:HDFCBK|HDFCBNK|ICICIB|AXISBK|CBSSBI|SBIPSG|SBIUPI|SBI|KOTAK|YESBNK|IDFC|INDUS|FEDERAL)$/.test(core) ||
    /^[A-Z]{3,12}$/.test(core) && hasKnownIndianBankSignal(core);
}

/** Fail closed. Heuristic confidence alone never authorizes a financial ledger write. */
export function isSafeSmsToAutoRecord(input: CaptureSignalInput, parsed: CaptureParseResult) {
  const text = `${input.title ?? ''} ${input.body}`;
  const payload = input.rawPayload;
  const nativeReference = typeof payload?.smsReferenceHash === 'string' && /^[a-f0-9]{64}$/.test(payload.smsReferenceHash);
  const nativeOrigin = ['android_sms_inbox_import', 'android_sms_scheduled_scan', 'android_sms_receiver'].includes(String(payload?.captureOrigin));
  if (input.source !== 'sms' || !nativeOrigin || payload?.smsAutoRecordSafe !== true || !nativeReference ||
      !isRecognizedBankSmsSender(input.sender ?? '') || parsed.parseStatus !== 'draft' || !parsed.type ||
      !parsed.reliableCategory || !parsed.category || !parsed.amount || !Number.isFinite(parsed.amount) ||
      !Number.isSafeInteger(Math.round(parsed.amount * 100)) || !parsed.transactionDate || !isAllowedTransactionDate(parsed.transactionDate) ||
      !parsed.merchantLabel || parsed.explanation.matchedMerchantPattern === 'source fallback') return false;
  if (/\b(?:aed|usd|eur|gbp|sar|qar|omr|bhd|kwd|pending|initiated|scheduled|failed|declined|reversed|reversal|refund|cashback|dispute|suspicious|fraud|unauthorized|unknown|not completed)\b|https?:|www\.|[$€£]/i.test(text)) return false;
  const debit = /\b(?:debited|spent|paid|sent|withdrawn|transferred)\b/i.test(text);
  const credit = /\b(?:credited|received|deposited)\b/i.test(text);
  if (debit === credit || (parsed.type === 'expense') !== debit) return false;
  const amountMatches = [...text.matchAll(/(?:\b(?:inr|rupees?)\b|rs\.?|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?![0-9.])/gi)]
    .filter((match) => !/\b(?:bal(?:ance)?|limit)\.?\s*(?:(?:is|of)\s*)?[:=-]?\s*$/i.test(text.slice(Math.max(0, (match.index ?? 0) - 70), match.index)));
  return amountMatches.length === 1 && /^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d{1,2})?$/.test(amountMatches[0][1]) && Number(amountMatches[0][1].replace(/,/g, '')) === parsed.amount;
}
