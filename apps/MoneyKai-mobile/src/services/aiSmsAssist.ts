import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import { hasKnownIndianBankSignal } from '@/constants/indiaBankAliases';
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
const validInstruments = new Set(['upi', 'debit_card', 'credit_card', 'bank_transfer', 'cheque', 'wallet', 'cash', 'unknown']);
const validBankRails = new Set(['imps', 'neft', 'rtgs', 'upi', 'card', 'cheque', 'wallet', 'unknown']);
const validCardDirections = new Set(['debit', 'credit', 'unknown']);

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
  const senderAndBody = `${redactedInput.sender ?? ''} ${redactedInput.body}`;
  const hasKnownBank = hasKnownIndianBankSignal(senderAndBody);
  const hasUpiText = /\bupi\b|\bvpa\b|\[vpa\]/i.test(redactedInput.body);
  const hasCardText = /\b(?:credit card|debit card|card ending|card)\b/i.test(redactedInput.body);
  const hasBankTransferText = /\b(?:imps|neft|rtgs|bank transfer|a\/c|acct|account)\b/i.test(redactedInput.body);
  const hasChequeText = /\b(?:cheque|chq)\b/i.test(redactedInput.body);
  const hasWalletText = /\bwallet\b/i.test(redactedInput.body);
  const looksLikeThreatOrAd = /\b(?:otp|one[- ]time password|verification code|do not share|offer|coupon|discount|kyc|blocked|suspended|verify|click|http|https|bit\.ly|tinyurl|loan|pre[- ]approved)\b/i.test(redactedInput.body);
  const looksLikePendingOrService = /\b(?:sent for clearing|will be confirmed|will be credited|once processed|has been added|opening a new|created for you|statement|bill due)\b/i.test(redactedInput.body);
  const isCardPaymentConfirmation = /\byour payment of\b.+\bfor card ending\b.+\bhas been credited\b/i.test(redactedInput.body);

  if (candidate.status !== 'transaction') {
    reasons.push('candidate is not a transaction');
  }

  if (candidate.status === 'transaction' && (looksLikeThreatOrAd || looksLikePendingOrService || isCardPaymentConfirmation)) {
    reasons.push('transaction must not be OTP, scam, ad, pending, service, or card-payment-confirmation text');
  }

  if (!candidate.amount || candidate.amount <= 0) {
    reasons.push('amount must be positive');
  } else if (amountText && !body.replace(/,/g, '').includes(amountText)) {
    reasons.push('amount must be present in the redacted message');
  }

  if (candidate.currency !== 'INR') {
    reasons.push('currency must be INR');
  }

  const hasDebitText = /\b(?:debited|debit|paid|sent|spent|withdrawn|withdrawal|purchase|charged|trx\. of|approved)\b/i.test(redactedInput.body);
  const hasCreditText = /\b(?:credited|credit|received|refund|cashback|salary|deposited|deposit|cleared)\b/i.test(redactedInput.body);
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

  if (candidate.paymentMethod === 'upi' && !hasUpiText) {
    reasons.push('UPI payment method must be supported by UPI text');
  }
  if (candidate.paymentMethod === 'card' && !hasCardText) {
    reasons.push('card payment method must be supported by card text');
  }
  if (candidate.paymentMethod === 'bank' && !(hasKnownBank || hasBankTransferText || hasChequeText)) {
    reasons.push('bank payment method must be supported by known bank, account, rail, or cheque text');
  }
  if (candidate.paymentMethod === 'wallet' && !hasWalletText) {
    reasons.push('wallet payment method must be supported by wallet text');
  }

  if (candidate.instrument && !validInstruments.has(candidate.instrument)) {
    reasons.push('instrument must be one of the supported SMS instruments');
  }
  if (candidate.bankRail && !validBankRails.has(candidate.bankRail)) {
    reasons.push('bank rail must be one of the supported rails');
  }
  if (candidate.cardDirection && !validCardDirections.has(candidate.cardDirection)) {
    reasons.push('card direction must be debit, credit, or unknown');
  }

  if ((candidate.instrument === 'debit_card' || candidate.instrument === 'credit_card') && !hasCardText) {
    reasons.push('card instrument must be supported by card text');
  }
  if (candidate.instrument === 'cheque' && !hasChequeText) {
    reasons.push('cheque instrument must be supported by cheque text');
  }
  if (candidate.instrument === 'bank_transfer' && !(hasKnownBank || hasBankTransferText)) {
    reasons.push('bank transfer instrument must be supported by known bank, account, or transfer rail text');
  }
  if (candidate.bankName && !hasKnownIndianBankSignal(candidate.bankName)) {
    reasons.push('bank name must match the known India bank alias list');
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
