import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import type { CaptureParseResult, CaptureSignalInput, MerchantCategoryRule } from '@/types/capture';
import type { TransactionType } from '@/types/transaction';

type KeywordRule = {
  category: string;
  terms: string[];
};

const EXPENSE_KEYWORDS: KeywordRule[] = [
  { category: 'food', terms: ['swiggy', 'zomato', 'restaurant', 'cafe', 'coffee', 'pizza', 'food', 'dining'] },
  { category: 'shopping', terms: ['amazon', 'flipkart', 'myntra', 'store', 'mall', 'shopping', 'retail'] },
  { category: 'transport', terms: ['uber', 'ola', 'metro', 'fuel', 'petrol', 'diesel', 'taxi', 'bus', 'train'] },
  { category: 'rent', terms: ['rent', 'housing', 'landlord', 'room'] },
  { category: 'education', terms: ['course', 'school', 'college', 'udemy', 'book', 'tuition'] },
  { category: 'entertainment', terms: ['netflix', 'spotify', 'bookmyshow', 'movie', 'game', 'entertainment'] },
  { category: 'bills', terms: ['recharge', 'electricity', 'bill', 'broadband', 'mobile', 'utility', 'gas'] },
  { category: 'healthcare', terms: ['pharmacy', 'hospital', 'clinic', 'doctor', 'medical', 'medicine'] },
];

const INCOME_KEYWORDS: KeywordRule[] = [
  { category: 'allowance', terms: ['salary', 'allowance', 'payroll', 'credited'] },
  { category: 'freelance', terms: ['freelance', 'invoice', 'client'] },
  { category: 'bonus', terms: ['bonus', 'reward'] },
  { category: 'refund', terms: ['refund', 'cashback', 'reversal'] },
];

const PAYMENT_KEYWORDS: Record<string, string[]> = {
  upi: ['upi', 'vpa'],
  card: ['card', 'debit card', 'credit card', 'pos'],
  bank: ['neft', 'imps', 'rtgs', 'bank transfer', 'account'],
  wallet: ['wallet', 'paytm', 'phonepe wallet', 'amazon pay'],
};
type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];

const DEBIT_TERMS = ['debited', 'spent', 'paid', 'purchase', 'withdrawn', 'sent', 'dr', 'charged'];
const CREDIT_TERMS = ['credited', 'received', 'refund', 'cashback', 'salary', 'cr', 'deposited'];

const validExpenseCategory = new Set(EXPENSE_CATEGORIES.map((category) => category.id));
const validIncomeCategory = new Set(INCOME_CATEGORIES.map((category) => category.id));
const validPaymentMethod = new Set(PAYMENT_METHODS.map((paymentMethod) => paymentMethod.id));

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

export const normalizeMerchantKey = (value: string) =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\b(pvt|private|ltd|limited|india|upi|pay)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const scoreKeywordCategory = (text: string, type: TransactionType) => {
  const rules = type === 'income' ? INCOME_KEYWORDS : EXPENSE_KEYWORDS;
  const match = rules.find((rule) => rule.terms.some((term) => text.includes(term)));
  return match?.category;
};

const detectTransactionType = (text: string): TransactionType => {
  const hasCredit = CREDIT_TERMS.some((term) => text.includes(term));
  const hasDebit = DEBIT_TERMS.some((term) => text.includes(term));

  if (hasCredit && !hasDebit) return 'income';
  return 'expense';
};

const extractAmount = (text: string) => {
  const matches = [...text.matchAll(/(?:inr|rs\.?|₹|\$|usd|eur|gbp|aed)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi)];
  const amounts = matches
    .map((match) => Number(match[1].replace(/,/g, '')))
    .filter((value) => Number.isFinite(value) && value > 0);

  return amounts.find((value) => value >= 1);
};

const extractMerchant = (text: string, input: CaptureSignalInput) => {
  const patterns = [
    /\b(?:at|to|towards|merchant|m\/s|paid to)\s+([a-z0-9][a-z0-9 &._-]{2,44})/i,
    /\b(?:from)\s+([a-z0-9][a-z0-9 &._-]{2,44})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return normalizeWhitespace(match[1].replace(/\b(?:on|via|using|ref|txn|transaction).*/i, ''));
    }
  }

  return input.sender ?? input.sourceApp ?? input.title;
};

const detectPaymentMethod = (text: string) => {
  const match = Object.entries(PAYMENT_KEYWORDS).find(([, terms]) => terms.some((term) => text.includes(term)));
  return match?.[0];
};

export const buildCaptureDedupeKey = (input: CaptureSignalInput, parsed: CaptureParseResult) => {
  const receivedAt = new Date(input.receivedAt ?? Date.now());
  const hourBucket = Number.isFinite(receivedAt.getTime())
    ? receivedAt.toISOString().slice(0, 13)
    : new Date().toISOString().slice(0, 13);
  const amount = parsed.amount?.toFixed(2) ?? 'unknown';
  const merchant = parsed.merchantKey ?? normalizeMerchantKey(input.sender ?? input.sourceApp ?? 'unknown');

  return [input.source, merchant, amount, parsed.type ?? 'expense', hourBucket].join(':');
};

export const parseCapturedSignal = (
  input: CaptureSignalInput,
  merchantRules: MerchantCategoryRule[] = []
): CaptureParseResult => {
  const title = input.title ?? '';
  const body = input.body ?? '';
  const text = normalizeWhitespace(`${title} ${body}`);
  const lowered = text.toLowerCase();
  const amount = extractAmount(text);
  const type = detectTransactionType(lowered);
  const merchantLabel = extractMerchant(text, input);
  const merchantKey = merchantLabel ? normalizeMerchantKey(merchantLabel) : undefined;
  const paymentMethod = detectPaymentMethod(lowered) ?? 'bank';
  const learnedRule = merchantKey
    ? merchantRules.find((rule) => rule.merchantKey === merchantKey || merchantKey.includes(rule.merchantKey))
    : undefined;
  const keywordCategory = scoreKeywordCategory(lowered, type);
  const category = learnedRule?.category ?? keywordCategory;
  const isValidCategory = category
    ? type === 'income'
      ? validIncomeCategory.has(category)
      : validExpenseCategory.has(category)
    : false;
  const normalizedPaymentMethod: PaymentMethodId = validPaymentMethod.has(paymentMethod as PaymentMethodId)
    ? (paymentMethod as PaymentMethodId)
    : 'bank';

  let confidence = 0;
  if (amount) confidence += 0.35;
  if (merchantKey) confidence += 0.2;
  if (learnedRule) confidence += 0.35;
  if (!learnedRule && keywordCategory) confidence += 0.2;
  if (normalizedPaymentMethod) confidence += 0.1;

  return {
    amount,
    type,
    merchantLabel,
    merchantKey,
    category: isValidCategory ? category : undefined,
    paymentMethod: normalizedPaymentMethod,
    confidence: Math.min(Number(confidence.toFixed(2)), 0.95),
    reason: learnedRule ? 'matched learned merchant rule' : keywordCategory ? 'matched category keyword' : 'needs category review',
  };
};
