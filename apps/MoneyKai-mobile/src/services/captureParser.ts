import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import { getAutomaticExpenseCategory } from '@/services/captureCategoryRules';
import type {
  CaptureParseExplanation,
  CaptureParseResult,
  CaptureParseStatus,
  CaptureSignalInput,
  MerchantCategoryRule,
} from '@/types/capture';
import type { TransactionType } from '@/types/transaction';

type KeywordRule = {
  category: string;
  terms: string[];
};

type IgnoreRule = {
  reason: string;
  patterns: RegExp[];
};

type DirectionMatch = {
  type?: TransactionType;
  terms: string[];
};

type MerchantMatch = {
  label?: string;
  pattern?: string;
};

type AmountMatch = {
  value?: number;
  raw?: string;
  pattern?: string;
};

type PaymentMethodMatch = {
  id: PaymentMethodId;
  label: string;
};

const EXPENSE_KEYWORDS: KeywordRule[] = [
  { category: 'food', terms: ['swiggy', 'zomato', 'restaurant', 'cafe', 'coffee', 'pizza', 'food', 'dining'] },
  { category: 'shopping', terms: ['amazon', 'flipkart', 'myntra', 'store', 'mart', 'basket', 'pantry', 'mall', 'shopping', 'retail', 'reliance fresh'] },
  { category: 'transport', terms: ['uber', 'ola', 'metro', 'fuel', 'petrol', 'diesel', 'taxi', 'bus', 'train', 'rail'] },
  { category: 'rent', terms: ['rent', 'housing', 'landlord', 'room'] },
  { category: 'entertainment', terms: ['netflix', 'spotify', 'bookmyshow', 'movie', 'game', 'entertainment'] },
  { category: 'education', terms: ['course', 'school', 'college', 'udemy', 'book', 'tuition'] },
  { category: 'bills', terms: ['recharge', 'electricity', 'bill', 'bescom', 'broadband', 'mobile', 'utility', 'gas'] },
  { category: 'healthcare', terms: ['pharmacy', 'hospital', 'clinic', 'doctor', 'medical', 'medicine'] },
];

const INCOME_KEYWORDS: KeywordRule[] = [
  { category: 'refund', terms: ['refund', 'cashback', 'reversal'] },
  { category: 'freelance', terms: ['freelance', 'invoice', 'client'] },
  { category: 'allowance', terms: ['salary', 'allowance', 'payroll', 'credited'] },
  { category: 'bonus', terms: ['bonus', 'reward'] },
];

const IGNORE_RULES: IgnoreRule[] = [
  { reason: 'otp or verification message', patterns: [/\botp\b/i, /\bone[- ]time password\b/i, /\bverification code\b/i, /\bdo not share\b/i] },
  { reason: 'failed payment message', patterns: [/\bfailed\b/i, /\bunsuccessful\b/i, /\bcould not (?:be )?process/i] },
  { reason: 'declined payment message', patterns: [/\bdeclined\b/i, /\binsufficient limit\b/i] },
  { reason: 'low balance alert', patterns: [/\blow balance\b/i, /\bminimum balance\b/i] },
  { reason: 'statement or summary message', patterns: [/\bstatement\b/i, /\btotal spends\b/i, /\bmini statement\b/i] },
  { reason: 'promotional offer message', patterns: [/\boffer\b/i, /\bget cashback up to\b/i, /\bvalid today\b/i, /\bcoupon\b/i] },
  { reason: 'mandate setup message', patterns: [/\bmandate\b/i, /\bautopay\b/i, /\bpayments will start\b/i] },
  { reason: 'reversed before settlement', patterns: [/\breversed before settlement\b/i, /\bno amount is payable\b/i] },
  { reason: 'payment request is not completed', patterns: [/\bcollect request\b/i, /\bpayment request\b/i, /\bpending\b/i, /\bapprove to pay\b/i] },
  { reason: 'bill due reminder', patterns: [/\bbill\b.+\bdue\b/i, /\bdue on\b/i, /\bpay now to avoid\b/i] },
  { reason: 'mandate or scheduled autopay message', patterns: [/\bmandate\b/i, /\bautopay\b/i, /\bwill be debited\b/i, /\bscheduled\b/i] },
  { reason: 'bank feedback or survey message', patterns: [/\bshare your experience\b/i, /\bfeedback\b/i, /\bthank you for the transaction done today\b/i] },
  { reason: 'credential or password reminder', patterns: [/\bpassword\b/i, /\bcredential\b/i] },
  { reason: 'deposit instrument setup message', patterns: [/\btdr\/stdr\b/i] },
  { reason: 'cheque payment message', patterns: [/\bcheque\b/i, /\bchq\b/i] },
  { reason: 'GST or tax message', patterns: [/\bgst(?:in)?\b/i, /\bcgst\b/i, /\bsgst\b/i, /\bigst\b/i, /\btax invoice\b/i] },
];

const PAYMENT_KEYWORDS: { id: PaymentMethodId; label: string; terms: RegExp[] }[] = [
  { id: 'upi', label: 'UPI', terms: [/\bupi\b/i, /\bvpa\b/i, /@[a-z][a-z0-9.-]+\b/i] },
  { id: 'card', label: 'card', terms: [/\bdebit card\b/i, /\bcredit card\b/i, /\bcard ending\b/i, /\bpos\b/i, /\bcard\b/i] },
  { id: 'wallet', label: 'wallet', terms: [/\bwallet\b/i, /\bpaytm wallet\b/i] },
  { id: 'bank', label: 'bank transfer', terms: [/\bneft\b/i, /\bimps\b/i, /\brtgs\b/i, /\bbank transfer\b/i, /\baccount\b/i, /\ba\/c\b/i] },
];

const AMOUNT_PATTERNS: { name: string; regex: RegExp }[] = [
  {
    name: 'currency prefix',
    regex: /(?:\b(?:inr|rupees?)\b|rs\.?|\u20b9|â‚¹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi,
  },
  {
    name: 'currency suffix',
    regex: /([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:\b(?:inr|rupees?)\b|rs\.?|\u20b9|â‚¹)/gi,
  },
  {
    name: 'amount after completed action',
    regex: /\b(?:debited|credited|spent|paid|received|sent|withdrawn|transferred|deposited)\s+(?:by|of)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)\b/gi,
  },
  {
    name: 'withdrawal amount',
    regex: /\bwithdrawal\b.{0,40}?\bof\s+([0-9][0-9,]*(?:\.[0-9]{1,2})?)\b/gi,
  },
];

const MERCHANT_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'upi slash merchant', regex: /\bupi\/p2[am]\/(?:[a-z0-9/-]{6,}|\[(?:number|ref)\])\/([a-z0-9][a-z0-9 &.'-]{2,80}?)(?=\s+(?:not you\?|sms blockupi\b|axis bank\b)|$)/i },
  { name: 'upi payment to', regex: /\b(?:upi\s+)?payment(?:\s+of\s+(?:\b(?:inr|rupees?)\b|rs\.?|\u20b9|â‚¹)?\s*[0-9][0-9,.]*)?\s+(?:to|at)\s+([a-z0-9][a-z0-9 &.'/-]{2,80})/i },
  { name: 'paid to', regex: /\bpaid(?:\s+(?:\b(?:inr|rupees?)\b|rs\.?|\u20b9|â‚¹)?\s*[0-9][0-9,.]*)?\s+(?:from\s+[a-z ]+\s+)?to\s+([a-z0-9][a-z0-9 &.'/-]{2,80})/i },
  { name: 'sent to', regex: /\b(?:sent|transferred)(?:\s+(?:\b(?:inr|rupees?)\b|rs\.?|\u20b9|â‚¹)?\s*[0-9][0-9,.]*)?\s+to\s+([a-z0-9][a-z0-9 &.'/-]{2,80})/i },
  { name: 'received from', regex: /\b(?:received|credited)(?:\s+(?:\b(?:inr|rupees?)\b|rs\.?|\u20b9|â‚¹)?\s*[0-9][0-9,.]*)?(?:\s+to\s+(?:your\s+)?(?:a\/c|account)[a-z0-9\s]*)?\s+from\s+([a-z0-9][a-z0-9 &.'/-]{2,80})/i },
  { name: 'from sender', regex: /\bfrom\s+([a-z0-9][a-z0-9 &.'/-]{2,80})\s+(?:as|for|via|ref|utr|imps|neft|rtgs|upi|order)/i },
  { name: 'merchant field', regex: /\b(?:merchant|m\/s|info)\s*[:.-]?\s+([a-z0-9][a-z0-9 &.'/-]{2,80})/i },
  { name: 'at merchant', regex: /\bat\s+([a-z0-9][a-z0-9 &.'/-]{2,80})/i },
  { name: 'towards merchant', regex: /\btowards\s+([a-z0-9][a-z0-9 &.'/-]{2,80})/i },
  { name: 'for merchant purpose', regex: /\bfor\s+([a-z0-9][a-z0-9 &.'/-]{2,80})/i },
];

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];

const validExpenseCategory = new Set(EXPENSE_CATEGORIES.map((category) => category.id));
const validIncomeCategory = new Set(INCOME_CATEGORIES.map((category) => category.id));
const validPaymentMethod = new Set(PAYMENT_METHODS.map((paymentMethod) => paymentMethod.id));

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const normalizeText = (value: string) =>
  normalizeWhitespace(value.replace(/â‚¹/g, 'Rs').replace(/Â·/g, '|'));

const HIDDEN_NOTIFICATION_CONTENT_REASON = 'notification content hidden by Android privacy settings';

const hiddenNotificationContentPatterns = [
  /\bnotification content hidden\b/i,
  /\bcontent hidden\b/i,
  /\bhidden content\b/i,
  /\bmessage hidden\b/i,
  /\bsensitive content hidden\b/i,
  /\bunlock(?: your phone)? to view\b/i,
];

const sanitizeSnippet = (value: string) =>
  normalizeText(value)
    .replace(/\b\d{6}\b/g, '[code]')
    .replace(/\b(?:xx|x{2,})\d+\b/gi, '[masked]')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\b/gi, '[vpa]')
    .replace(/\b((?:upi\s*)?(?:ref(?:erence)?|rrn|utr|transaction id|txn id|order id|imps)\s*(?:no\.?|number|id)?\s*[:#-]?)\s*[a-z0-9/-]{6,}/gi, '$1 [ref]')
    .replace(/\b\d{8,}\b/g, '[number]')
    .slice(0, 180);

const summarizeReference = (reference?: string) =>
  reference ? `ref-${reference.slice(-4)}` : undefined;

const isHiddenNotificationContent = (input: CaptureSignalInput, text: string) =>
  input.source === 'notification' && hiddenNotificationContentPatterns.some((pattern) => pattern.test(text));

export const normalizeMerchantKey = (value: string) =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/(?:upi|txn|transaction|ref|rrn|utr|id|no)\s*[:#-]?\s*[a-z0-9/-]+.*$/i, '')
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\b/gi, '')
    .replace(/\b(?:pvt|private|ltd|limited|india|upi|pay)\b/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const scoreKeywordCategory = (text: string, merchantKey: string | undefined, type: TransactionType) => {
  const searchable = `${text} ${merchantKey ?? ''}`;
  const rules = type === 'income' ? INCOME_KEYWORDS : EXPENSE_KEYWORDS;
  const match = rules.find((rule) => rule.terms.some((term) => searchable.includes(term)));
  return match?.category;
};

const detectIgnoreReason = (text: string, amount?: number) => {
  const matched = IGNORE_RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(text)));
  return matched?.reason ?? (!amount ? 'no transaction amount found' : undefined);
};

const detectDirection = (text: string): DirectionMatch => {
  const creditPatterns: [RegExp, string][] = [
    [/\bcredited\b/i, 'credited'],
    [/\breceived\b/i, 'received'],
    [/\bdeposited\b/i, 'deposited'],
    [/\bsalary\b/i, 'salary'],
    [/\brefund\b/i, 'refund'],
    [/\bcashback\b/i, 'cashback'],
  ];
  const debitPatterns: [RegExp, string][] = [
    [/\bdebited\b/i, 'debited'],
    [/\bspent\b/i, 'spent'],
    [/\bpaid\b/i, 'paid'],
    [/\bsent\b/i, 'sent'],
    [/\btransferred\b/i, 'transferred'],
    [/\bwithdrawn\b/i, 'withdrawn'],
    [/\bwithdrawal\b/i, 'withdrawal'],
    [/\bdebit\b/i, 'debit'],
    [/\bpurchase\b/i, 'purchase'],
    [/\bcharged\b/i, 'charged'],
    [/\bsuccessful\b/i, 'successful'],
    [/\bcompleted\b/i, 'completed'],
    [/\bused\b/i, 'used'],
    [/\bpos transaction\b/i, 'pos transaction'],
  ];
  const creditTerms = creditPatterns.filter(([pattern]) => pattern.test(text)).map(([, term]) => term);
  const debitTerms = debitPatterns.filter(([pattern]) => pattern.test(text)).map(([, term]) => term);

  if (creditTerms.length > 0 && debitTerms.length === 0) {
    return { type: 'income', terms: creditTerms };
  }

  if (debitTerms.length > 0 && creditTerms.length === 0) {
    return { type: 'expense', terms: debitTerms };
  }

  if (creditTerms.some((term) => term === 'refund' || term === 'cashback' || term === 'credited')) {
    return { type: 'income', terms: [...creditTerms, ...debitTerms] };
  }

  if (debitTerms.length > 0) {
    return { type: 'expense', terms: [...debitTerms, ...creditTerms] };
  }

  return { terms: [] };
};

const extractAmount = (text: string): AmountMatch => {
  for (const pattern of AMOUNT_PATTERNS) {
    const matches = [...text.matchAll(pattern.regex)];
    const match = matches.find((item) => {
      const value = Number(item[1].replace(/,/g, ''));
      return Number.isFinite(value) && value > 0;
    });

    if (match) {
      return {
        value: Number(match[1].replace(/,/g, '')),
        raw: match[0],
        pattern: pattern.name,
      };
    }
  }

  return {};
};

const cleanMerchantLabel = (value: string) => {
  const withoutSensitiveParts = value
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\b/gi, '')
    .replace(/\b(?:upi|txn|transaction|ref|rrn|utr|order|id|no)\b\s*[:#-]?\s*[a-z0-9/-]+.*$/i, '')
    .replace(/\b(?:on|via|using|approved|has been|was|is|as|for)\b.*$/i, '')
    .replace(/\b(?:a\/c|acct|account|card|ending|xx|x{2,})\b.*$/i, '')
    .trim()
    .replace(/[.:-]+$/g, '')
    .trim();

  return normalizeWhitespace(withoutSensitiveParts);
};

const extractMerchant = (text: string, input: CaptureSignalInput): MerchantMatch => {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern.regex);
    const label = match?.[1] ? cleanMerchantLabel(match[1]) : undefined;

    if (label && normalizeMerchantKey(label) && !/^(your|merchant|payment|merchant payment)$/i.test(label)) {
      return { label, pattern: pattern.name };
    }
  }

  const fallback = input.sender ?? input.sourceApp ?? input.title;
  return fallback ? { label: normalizeWhitespace(fallback), pattern: 'source fallback' } : {};
};

const detectPaymentMethod = (text: string, input: CaptureSignalInput): PaymentMethodMatch => {
  const combined = `${text} ${input.sourceApp ?? ''} ${input.sender ?? ''}`;
  if (/\b(?:amazon pay|paytm|phonepe wallet)\b/i.test(input.sourceApp ?? '') || /\bwallet\b/i.test(text)) {
    return { id: 'wallet', label: 'wallet' };
  }

  const matched = PAYMENT_KEYWORDS.find((method) => method.terms.some((term) => term.test(combined)));

  return matched ? { id: matched.id, label: matched.label } : { id: 'bank', label: 'bank fallback' };
};

const extractTransactionReference = (text: string) => {
  const match =
    text.match(/\b(?:upi\s*)?(?:ref(?:erence)?|rrn|utr|transaction id|txn id|order id|imps)\s*(?:no\.?|number|id)?\s*[:#-]?\s*([a-z0-9/-]{6,})/i) ??
    text.match(/\bupi\/p2[am]\/([a-z0-9/-]{6,})\//i);
  return match?.[1]?.toLowerCase();
};

const createExplanation = (params: {
  text: string;
  amount: AmountMatch;
  direction: DirectionMatch;
  merchant: MerchantMatch;
  paymentMethod: PaymentMethodMatch;
  category?: string;
  learnedRule?: MerchantCategoryRule;
  ignoreReason?: string;
  confidenceFactors: string[];
  reference?: string;
}): CaptureParseExplanation => ({
  matchedAmount: params.amount.raw,
  matchedAmountPattern: params.amount.pattern,
  matchedDirectionTerms: params.direction.terms,
  matchedMerchantPattern: params.merchant.pattern,
  matchedPaymentMethod: params.paymentMethod.label,
  matchedCategoryRule: params.learnedRule
    ? `learned merchant rule: ${params.learnedRule.merchantLabel}`
    : params.category
      ? `keyword category: ${params.category}`
      : undefined,
  confidenceFactors: params.confidenceFactors,
  ignoreReason: params.ignoreReason,
  safeSnippet: sanitizeSnippet(params.text),
  dedupeReference: summarizeReference(params.reference),
});

const calculateConfidence = (params: {
  amount?: number;
  direction: DirectionMatch;
  merchantKey?: string;
  merchantPattern?: string;
  learnedRule?: MerchantCategoryRule;
  category?: string;
  paymentMethod?: string;
  reference?: string;
  status: CaptureParseStatus;
}) => {
  const factors: string[] = [];
  let confidence = 0;

  if (params.amount) {
    confidence += 0.3;
    factors.push('amount found');
  }

  if (params.direction.type) {
    confidence += 0.2;
    factors.push(`${params.direction.type} direction found`);
  }

  if (params.merchantKey) {
    confidence += params.merchantPattern === 'source fallback' ? 0.08 : 0.2;
    factors.push(params.merchantPattern === 'source fallback' ? 'source fallback merchant' : 'merchant phrase found');
  }

  if (params.learnedRule) {
    confidence += 0.25;
    factors.push('learned merchant rule matched');
  } else if (params.category) {
    confidence += 0.1;
    factors.push('category keyword matched');
  }

  if (params.paymentMethod) {
    confidence += 0.1;
    factors.push(`${params.paymentMethod} payment method found`);
  }

  if (params.reference) {
    confidence += 0.05;
    factors.push('transaction reference found');
  }

  if (params.status === 'review') {
    confidence = Math.min(confidence, 0.62);
    factors.push('requires review');
  }

  if (params.status === 'ignore') {
    confidence = Math.min(confidence, 0.15);
    factors.push('ignored by safety rule');
  }

  return {
    confidence: Math.min(Number(confidence.toFixed(2)), 0.96),
    factors,
  };
};

export const buildCaptureDedupeKey = (input: CaptureSignalInput, parsed: CaptureParseResult) => {
  const receivedAt = new Date(input.receivedAt ?? Date.now());
  const validTime = Number.isFinite(receivedAt.getTime()) ? receivedAt.getTime() : Date.now();
  const timeBucketMinutes = parsed.transactionReference ? 60 : 30;
  const bucketMs = timeBucketMinutes * 60 * 1000;
  const timeBucket = new Date(Math.floor(validTime / bucketMs) * bucketMs).toISOString();
  const amount = parsed.amount?.toFixed(2) ?? 'unknown';
  const merchant = parsed.merchantKey ?? normalizeMerchantKey(input.sender ?? input.sourceApp ?? 'unknown');
  const reference = parsed.transactionReference ?? 'no-ref';

  return [input.source, input.sourceApp ?? input.sender ?? 'unknown', merchant, amount, parsed.type ?? 'unknown', reference, timeBucket].join(':');
};

export const parseCapturedSignal = (
  input: CaptureSignalInput,
  merchantRules: MerchantCategoryRule[] = []
): CaptureParseResult => {
  const title = input.title ?? '';
  const body = input.body ?? '';
  const text = normalizeText(`${title} ${body}`);

  if (isHiddenNotificationContent(input, text)) {
    return {
      parseStatus: 'ignore',
      ignoreReason: HIDDEN_NOTIFICATION_CONTENT_REASON,
      explanation: {
        matchedDirectionTerms: [],
        confidenceFactors: ['notification privacy blocked content'],
        ignoreReason: HIDDEN_NOTIFICATION_CONTENT_REASON,
        safeSnippet: sanitizeSnippet(text || input.sourceApp || 'Notification content hidden'),
      },
      confidence: 0.05,
      reason: HIDDEN_NOTIFICATION_CONTENT_REASON,
    };
  }

  const lowered = text.toLowerCase();
  const amount = extractAmount(text);
  const ignoreReason = detectIgnoreReason(lowered, amount.value);
  const direction = detectDirection(text);
  const merchant = extractMerchant(text, input);
  const merchantKey = merchant.label ? normalizeMerchantKey(merchant.label) : undefined;
  const paymentMethod = detectPaymentMethod(text, input);
  const learnedRule = merchantKey
    ? merchantRules.find((rule) => rule.merchantKey === merchantKey || merchantKey.includes(rule.merchantKey))
    : undefined;
  const keywordCategory = direction.type ? scoreKeywordCategory(lowered, merchantKey, direction.type) : undefined;
  const automaticExpenseCategory = direction.type === 'expense' ? getAutomaticExpenseCategory(input, merchantKey) : undefined;
  const category = automaticExpenseCategory ?? learnedRule?.category ?? keywordCategory;
  const isValidCategory = category
    ? direction.type === 'income'
      ? validIncomeCategory.has(category)
      : validExpenseCategory.has(category)
    : false;
  const normalizedPaymentMethod: PaymentMethodId = validPaymentMethod.has(paymentMethod.id) ? paymentMethod.id : 'bank';
  const reference = extractTransactionReference(text);

  let parseStatus: CaptureParseStatus = 'draft';
  let finalIgnoreReason = ignoreReason;

  if (ignoreReason) {
    parseStatus = 'ignore';
  } else if (!amount.value) {
    parseStatus = 'ignore';
    finalIgnoreReason = 'no transaction amount found';
  } else if (!direction.type) {
    parseStatus = 'ignore';
    finalIgnoreReason = 'no completed financial action found';
  } else if ((!merchantKey || merchant.pattern === 'source fallback') && category !== 'refund') {
    parseStatus = 'review';
  } else if (/\binitiated\b|\bwill be credited\b|\bonce processed\b/i.test(text)) {
    parseStatus = 'review';
  }

  const { confidence, factors } = calculateConfidence({
    amount: amount.value,
    direction,
    merchantKey,
    merchantPattern: merchant.pattern,
    learnedRule,
    category: isValidCategory ? category : undefined,
    paymentMethod: normalizedPaymentMethod,
    reference,
    status: parseStatus,
  });
  const explanation = createExplanation({
    text,
    amount,
    direction,
    merchant,
    paymentMethod,
    category: isValidCategory ? category : undefined,
    learnedRule,
    ignoreReason: finalIgnoreReason,
    confidenceFactors: factors,
    reference,
  });

  return {
    amount: amount.value,
    type: direction.type,
    merchantLabel: merchant.label,
    merchantKey,
    category: isValidCategory ? category : undefined,
    paymentMethod: normalizedPaymentMethod,
    parseStatus,
    ignoreReason: finalIgnoreReason,
    transactionReference: reference,
    explanation,
    confidence,
    reason:
      finalIgnoreReason ??
      (learnedRule ? 'matched learned merchant rule' : isValidCategory ? 'matched category keyword' : 'needs category review'),
  };
};
