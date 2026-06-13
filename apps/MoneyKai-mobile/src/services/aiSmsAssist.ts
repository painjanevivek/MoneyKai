import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import { redactSensitiveSmsText } from '@/services/smsPrivacy';
import type {
  AiSmsParseCandidate,
  AiSmsParseInput,
  AiSmsValidationResult,
  CaptureParseResult,
  CaptureSettings,
  CaptureSignalInput,
} from '@/types/capture';

const validCategories = new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((category) => category.id));
const validPaymentMethods = new Set<string>(PAYMENT_METHODS.map((method) => method.id));

export const AI_SMS_FALLBACK_CONFIDENCE_THRESHOLD = 0.64;

export const redactSmsForAiAssist = (input: CaptureSignalInput): AiSmsParseInput => ({
  sender: input.sender,
  receivedAt: input.receivedAt ?? new Date().toISOString(),
  locale: 'en-IN',
  currency: 'INR',
  body: redactSensitiveSmsText(input.body)
    .replace(/\s+/g, ' ')
    .trim(),
});

export const shouldUseAiSmsFallback = (
  settings: CaptureSettings,
  input: CaptureSignalInput,
  parsed: CaptureParseResult
) =>
  Boolean(settings.aiSmsAssistEnabled) &&
  input.source === 'sms' &&
  (parsed.parseStatus === 'review' || parsed.confidence < AI_SMS_FALLBACK_CONFIDENCE_THRESHOLD);

export const validateAiSmsParseCandidate = (
  candidate: AiSmsParseCandidate,
  redactedInput: AiSmsParseInput
): AiSmsValidationResult => {
  const reasons: string[] = [];
  const body = redactedInput.body.toLowerCase();
  const amountText = candidate.amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 }).replace(/,/g, '');

  if (candidate.status !== 'transaction') {
    reasons.push('candidate is not a transaction');
  }

  if (!candidate.amount || candidate.amount <= 0) {
    reasons.push('amount must be positive');
  } else if (amountText && !body.replace(/,/g, '').includes(amountText)) {
    reasons.push('amount must be present in the redacted message');
  }

  if (candidate.currency !== 'INR') {
    reasons.push('currency must be INR');
  }

  const hasDebitText = /\b(?:debited|debit|paid|sent|spent|withdrawn|purchase|charged)\b/i.test(redactedInput.body);
  const hasCreditText = /\b(?:credited|credit|received|refund|cashback|salary|deposited)\b/i.test(redactedInput.body);
  if ((candidate.type === 'expense' || candidate.type === 'transfer') && !hasDebitText) {
    reasons.push('expense direction must be supported by message text');
  }
  if ((candidate.type === 'income' || candidate.type === 'refund' || candidate.type === 'reversal') && !hasCreditText) {
    reasons.push('income direction must be supported by message text');
  }

  if (candidate.categorySuggestion && !validCategories.has(candidate.categorySuggestion)) {
    reasons.push('category must be one of the app categories');
  }

  if (candidate.paymentMethod && !validPaymentMethods.has(candidate.paymentMethod)) {
    reasons.push('payment method must be one of the app payment methods');
  }

  const referencePresentLocally = /\b(?:upi\s*)?(?:ref(?:erence)?|refno|rrn|utr|transaction id|txn id|order id|imps(?:\s*ref)?)\b/i.test(redactedInput.body);
  if (candidate.transactionReferencePresent && !referencePresentLocally) {
    reasons.push('reference presence must be verified locally');
  }

  if (!Number.isFinite(candidate.confidence) || candidate.confidence < 0 || candidate.confidence > 1) {
    reasons.push('confidence must be between 0 and 1');
  }

  return {
    accepted: reasons.length === 0,
    reviewRequired: true,
    reasons,
  };
};
