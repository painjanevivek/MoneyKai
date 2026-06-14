import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import type { AiAttachmentAnalyzeResponse, AiAttachmentAnalyzeTask } from './types';

export type ReceiptPaymentMethod = (typeof PAYMENT_METHODS)[number]['id'];

export interface ReceiptReviewDraft {
  description: string;
  amount: string;
  transactionDate: string;
  categoryId: string;
  paymentMethod: ReceiptPaymentMethod;
}

const RECEIPT_CATEGORY_KEYWORDS: { categoryId: string; keywords: string[] }[] = [
  { categoryId: 'food', keywords: ['food', 'dining', 'restaurant', 'cafe', 'grocery', 'groceries', 'swiggy', 'zomato'] },
  { categoryId: 'shopping', keywords: ['shopping', 'shop', 'retail', 'store', 'mart', 'fashion', 'clothing', 'amazon'] },
  { categoryId: 'electronics', keywords: ['electronics', 'device', 'gadget', 'phone', 'laptop', 'computer'] },
  { categoryId: 'transport', keywords: ['transport', 'travel', 'uber', 'ola', 'metro', 'fuel', 'petrol', 'diesel', 'parking', 'bus', 'train'] },
  { categoryId: 'rent', keywords: ['rent', 'housing', 'apartment', 'lease', 'hostel'] },
  { categoryId: 'education', keywords: ['education', 'school', 'college', 'course', 'class', 'tuition', 'book'] },
  { categoryId: 'entertainment', keywords: ['entertainment', 'movie', 'cinema', 'game', 'gaming', 'streaming', 'ticket'] },
  { categoryId: 'bills', keywords: ['bill', 'utility', 'electricity', 'water', 'internet', 'broadband', 'phone', 'recharge'] },
  { categoryId: 'healthcare', keywords: ['health', 'healthcare', 'medical', 'medicine', 'pharmacy', 'hospital', 'clinic', 'doctor'] },
];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function buildDefaultAttachmentPrompt(task: AiAttachmentAnalyzeTask): string {
  if (task === 'receipt_extract') {
    return 'Extract the merchant, date, amount, currency, and likely spending category from this receipt. Keep the result review-only.';
  }

  return 'Describe what is visible in this image and call out any details the user should review.';
}

export function createReceiptReviewDraft(response: AiAttachmentAnalyzeResponse): ReceiptReviewDraft | null {
  const structured = response.structured;
  if (!structured) {
    return null;
  }

  return {
    description: structured.merchant?.trim() || 'Receipt purchase',
    amount: structured.amount != null && Number.isFinite(structured.amount) ? String(Math.max(0, Math.round(structured.amount))) : '',
    transactionDate: normalizeReceiptDate(structured.date),
    categoryId: mapReceiptCategoryToExpense(structured.category),
    paymentMethod: 'card',
  };
}

export function mapReceiptCategoryToExpense(rawCategory?: string | null): string {
  const normalized = normalizeText(rawCategory);
  if (!normalized) {
    return 'others';
  }

  const exactCategory = EXPENSE_CATEGORIES.find((category) => normalizeText(category.name) === normalized || category.id === normalized);
  if (exactCategory) {
    return exactCategory.id;
  }

  const keywordMatch = RECEIPT_CATEGORY_KEYWORDS.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)));
  return keywordMatch?.categoryId ?? 'others';
}

export function normalizeReceiptAmountInput(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function validateReceiptReviewDraft(draft: ReceiptReviewDraft): string | null {
  const amount = Number(draft.amount);

  if (!draft.description.trim()) {
    return 'Add a short transaction description before saving.';
  }

  if (!/^\d+$/.test(draft.amount) || !Number.isFinite(amount) || amount <= 0) {
    return 'Enter a valid transaction amount before saving.';
  }

  if (!ISO_DATE_PATTERN.test(draft.transactionDate) || Number.isNaN(new Date(`${draft.transactionDate}T12:00:00`).getTime())) {
    return 'Use a valid transaction date in YYYY-MM-DD format.';
  }

  return null;
}

function normalizeReceiptDate(rawDate?: string | null): string {
  if (!rawDate) {
    return new Date().toISOString().slice(0, 10);
  }

  if (ISO_DATE_PATTERN.test(rawDate)) {
    return rawDate;
  }

  const slashMatch = rawDate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    return `${normalizedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(rawDate);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizeText(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}
