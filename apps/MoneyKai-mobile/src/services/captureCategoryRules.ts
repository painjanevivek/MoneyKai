import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type Category } from '@/constants/categories';
import type { CaptureSignalInput, DraftTransaction } from '@/types/capture';

const FOOD_APP_PATTERNS = [/\bzomato\b/i, /\bswiggy\b/i];
const QUICK_COMMERCE_PATTERNS = [/\bzepto\b/i, /\bblinkit\b/i, /\bbig\s*basket\b/i, /\bswiggy\s*instamart\b/i];
const QUICK_COMMERCE_CATEGORY_IDS = new Set(['food', 'electronics', 'others']);

const buildSearchText = (...values: (string | undefined)[]) => values.filter(Boolean).join(' ');

export const getAutomaticExpenseCategory = (input: CaptureSignalInput, merchantKey?: string) => {
  const text = buildSearchText(input.title, input.body, input.sender, input.sourceApp, merchantKey);

  if (FOOD_APP_PATTERNS.some((pattern) => pattern.test(text))) {
    return 'food';
  }

  return undefined;
};

export const isQuickCommerceDraft = (draft: Pick<DraftTransaction, 'description' | 'merchantKey' | 'sourceApp' | 'parseExplanation'>) => {
  const text = buildSearchText(draft.description, draft.merchantKey, draft.sourceApp, draft.parseExplanation?.safeSnippet);
  return QUICK_COMMERCE_PATTERNS.some((pattern) => pattern.test(text));
};

export const getDraftCategoryOptions = (draft: DraftTransaction): Category[] => {
  if (draft.type === 'income') return INCOME_CATEGORIES;
  if (isQuickCommerceDraft(draft)) {
    return EXPENSE_CATEGORIES.filter((category) => QUICK_COMMERCE_CATEGORY_IDS.has(category.id));
  }
  return EXPENSE_CATEGORIES;
};
