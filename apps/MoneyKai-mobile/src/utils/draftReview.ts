import { getCategoryById } from '@/constants/categories';
import { getDraftCategoryOptions } from '@/services/captureCategoryRules';
import type { CaptureSource, DraftTransaction } from '@/types/capture';
import { fromLocalDateKey, isAllowedTransactionDate } from './calendarDates';

export type DraftReviewTab = 'pending' | 'reviewed' | 'all';
export type DraftReviewSource = 'all' | Exclude<CaptureSource, 'manual'>;

export function draftSourceLabel(source: DraftTransaction['captureSource']) {
  return source === 'sms' ? 'SMS' : source === 'notification' ? 'Notification' : 'Account Aggregator';
}

export function draftCategoryLabel(category?: string) {
  return category ? getCategoryById(category)?.name ?? category : 'Choose category';
}

export function draftDateLabel(date: string) {
  return fromLocalDateKey(date)?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) ?? 'Check date';
}

// Only used after explicit bulk approval. Unknown purpose is not guessed.
export function bulkDraftCategory(draft: DraftTransaction, selection?: string) {
  const options = getDraftCategoryOptions(draft);
  return [selection, draft.category, draft.suggestedCategory]
    .find((category) => options.some((option) => option.id === category))
    ?? (draft.type === 'income' ? 'other_income' : 'others');
}

export function filterReviewDrafts(drafts: DraftTransaction[], owner: string | undefined, tab: DraftReviewTab, source: DraftReviewSource, query: string) {
  if (!owner) return [];
  const search = query.trim().toLowerCase();
  return drafts.filter((draft) => draft.user_id === owner)
    .filter((draft) => tab === 'all' || (tab === 'pending' ? draft.status === 'pending' : draft.status === 'confirmed' || draft.status === 'ignored'))
    .filter((draft) => source === 'all' || draft.captureSource === source)
    .filter((draft) => !search || [draft.description, draft.captureAccountLabel, draft.captureBankLabel, draft.payment_method, draftCategoryLabel(draft.category), draftSourceLabel(draft.captureSource), String(draft.amount), draft.transaction_date].some((value) => value?.toLowerCase().includes(search)))
    .sort((a, b) => {
      const time = (draft: DraftTransaction) => Date.parse(draft.confirmedAt ?? draft.createdAt) || 0;
      return time(b) - time(a);
    });
}

// UI guard only; the store still owns ledger writes and duplicate checks.
export function draftConfirmationError(draft: DraftTransaction, owner: string | undefined, category: string | undefined, budget: number) {
  if (!owner || draft.user_id !== owner) return 'Your session changed. Reopen this draft from your own account.';
  if (draft.status !== 'pending') return 'This draft has already been reviewed.';
  if (!category || !getDraftCategoryOptions(draft).some((option) => option.id === category)) return 'Choose a category before confirming this draft.';
  if (!Number.isFinite(draft.amount) || draft.amount <= 0 || !draft.description.trim() || !isAllowedTransactionDate(draft.transaction_date)) return 'The amount, description or date needs correction. Ignore this draft and add the transaction manually.';
  if (!Number.isFinite(budget) || budget <= 0) return 'Set a monthly budget before confirming. Your draft will stay pending.';
  return undefined;
}
