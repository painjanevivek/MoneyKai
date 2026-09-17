import type { CategoryTotal } from '../types/transaction';

export type SpendingRunway = {
  state: 'no-budget' | 'no-spending' | 'on-track' | 'over-budget' | 'month-closed';
  daysRemaining: number;
  safeToSpendPerDay: number | null;
  topCategory: CategoryTotal | null;
  actionLabel: string;
};

const getDaysRemainingInSelectedMonth = (selectedMonthKey: string, referenceDate: Date) => {
  const match = /^(\d{4})-(\d{2})$/.exec(selectedMonthKey);
  if (!match || Number.isNaN(referenceDate.getTime())) {
    return 0;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) {
    return 0;
  }

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const selectedMonthStart = new Date(year, monthIndex, 1);
  const referenceMonthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);

  if (selectedMonthStart < referenceMonthStart) {
    return 0;
  }

  if (selectedMonthStart > referenceMonthStart) {
    return daysInMonth;
  }

  // Include today: the safe amount is usable immediately, including on the final day.
  return Math.max(1, daysInMonth - referenceDate.getDate() + 1);
};

/**
 * Turns a selected month's spending totals into one next decision. The daily
 * figure uses the unspent allowance and days left in that selected month.
 */
export const buildSpendingRunway = (
  monthlyAllowance: number,
  totalSpent: number,
  categoryTotals: CategoryTotal[],
  selectedMonthKey: string,
  referenceDate: Date = new Date()
): SpendingRunway => {
  const allowance = Number.isFinite(monthlyAllowance) ? Math.max(0, monthlyAllowance) : 0;
  const spent = Number.isFinite(totalSpent) ? Math.max(0, totalSpent) : 0;
  const topCategory = categoryTotals
    .filter((category) => Number.isFinite(category.total) && category.total > 0)
    .sort((first, second) => second.total - first.total)[0] ?? null;
  const daysRemaining = getDaysRemainingInSelectedMonth(selectedMonthKey, referenceDate);

  if (allowance <= 0) {
    return { state: 'no-budget', daysRemaining, safeToSpendPerDay: null, topCategory, actionLabel: 'Set monthly budget' };
  }

  if (daysRemaining <= 0) {
    return { state: 'month-closed', daysRemaining: 0, safeToSpendPerDay: null, topCategory, actionLabel: 'Review budget' };
  }

  const safeToSpendPerDay = Math.max(0, allowance - spent) / daysRemaining;

  if (spent <= 0) {
    return { state: 'no-spending', daysRemaining, safeToSpendPerDay, topCategory: null, actionLabel: 'Add your first expense' };
  }

  if (spent > allowance) {
    return { state: 'over-budget', daysRemaining, safeToSpendPerDay: 0, topCategory, actionLabel: 'Review budget now' };
  }

  return {
    state: 'on-track',
    daysRemaining,
    safeToSpendPerDay,
    topCategory,
    actionLabel: topCategory ? `Review ${topCategory.category}` : 'Review budget',
  };
};
