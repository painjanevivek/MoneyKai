import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { subMonths } from 'date-fns/subMonths';
import { CHALLENGE_TEMPLATES, type Challenge } from '../types/challenge';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import type { CategoryTotal, Transaction } from '../types/transaction';
import { formatCurrency } from './formatCurrency';

export type DashboardCategoryCard = {
  category: string;
  name: string;
  icon: string;
  color: string;
  spent: number;
  budget: number;
  progress: number;
};

export type DashboardInsight = {
  title: string;
  body: string;
  icon: string;
  tone: 'positive' | 'warning' | 'info';
};

export type SpendingTrendInsight =
  | {
      kind: 'category-change';
      category: string;
      currentAmount: number;
      previousAmount: number;
      changeAmount: number;
      changePercent: number | null;
      direction: 'up' | 'down' | 'new';
    }
  | {
      kind: 'uncategorized-spend';
      category: string;
      currentAmount: number;
      shareOfSpend: number;
    };

export type SavingsGoalSnapshot = {
  title: string;
  subtitle: string;
  current: number;
  target: number;
  progress: number;
  icon: string;
  color: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const getMonthKey = (date: string | Date) => {
  const value = typeof date === 'string' ? parseISO(date) : date;
  return format(value, 'yyyy-MM');
};

export const getMonthLabel = (monthKey: string) => format(parseISO(`${monthKey}-01`), 'MMMM yyyy');

export const getPreviousMonthKey = (monthKey: string) => format(subMonths(parseISO(`${monthKey}-01`), 1), 'yyyy-MM');

export const filterTransactionsByMonth = (transactions: Transaction[], monthKey: string) =>
  transactions.filter((transaction) => getMonthKey(transaction.transaction_date) === monthKey);

/**
 * Uses the same elapsed days for the in-progress month and its predecessor.
 * Historical month comparisons intentionally remain full-month comparisons.
 */
export const filterComparablePreviousMonthTransactions = (
  transactions: Transaction[],
  selectedMonthKey: string,
  referenceDate: Date = new Date()
) => {
  const previousMonthTransactions = filterTransactionsByMonth(transactions, getPreviousMonthKey(selectedMonthKey));

  if (selectedMonthKey !== getMonthKey(referenceDate)) {
    return previousMonthTransactions;
  }

  const cutoffDay = referenceDate.getDate();
  return previousMonthTransactions.filter((transaction) => parseISO(transaction.transaction_date).getDate() <= cutoffDay);
};

export const buildCategoryTotals = (transactions: Transaction[]): CategoryTotal[] => {
  const expenses = transactions.filter((transaction) => transaction.type === 'expense');
  const totalSpent = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const categoryMap = new Map<string, { total: number; count: number }>();

  expenses.forEach((transaction) => {
    const existing = categoryMap.get(transaction.category) ?? { total: 0, count: 0 };
    categoryMap.set(transaction.category, {
      total: existing.total + transaction.amount,
      count: existing.count + 1,
    });
  });

  return [...categoryMap.entries()]
    .map(([category, value]) => ({
      category,
      total: value.total,
      percentage: totalSpent > 0 ? (value.total / totalSpent) * 100 : 0,
      count: value.count,
    }))
    .sort((a, b) => b.total - a.total);
};

const UNCATEGORIZED_CATEGORY_IDS = new Set(['other', 'others', 'uncategorized', 'uncategorised']);
const UNCATEGORIZED_SPEND_SHARE_THRESHOLD = 0.45;
const MINIMUM_TREND_PERCENT = 10;

const getExpenseTotalsByCategory = (transactions: Transaction[]) => {
  const totals = new Map<string, number>();

  transactions.forEach((transaction) => {
    if (transaction.type !== 'expense' || !Number.isFinite(transaction.amount) || transaction.amount <= 0) {
      return;
    }

    totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount);
  });

  return totals;
};

const isUncategorizedCategory = (category: string) => UNCATEGORIZED_CATEGORY_IDS.has(category.trim().toLowerCase());

/**
 * Picks one decision-ready insight for the spending card. Absolute currency
 * movement determines importance; percentage is supporting context only.
 */
export const buildSpendingTrendInsight = (
  currentTransactions: Transaction[],
  previousTransactions: Transaction[]
): SpendingTrendInsight | null => {
  const currentTotals = getExpenseTotalsByCategory(currentTransactions);
  const previousTotals = getExpenseTotalsByCategory(previousTransactions);
  const currentTotal = [...currentTotals.values()].reduce((sum, amount) => sum + amount, 0);
  const previousTotal = [...previousTotals.values()].reduce((sum, amount) => sum + amount, 0);

  if (currentTotal <= 0) {
    return null;
  }

  const uncategorizedEntries = [...currentTotals.entries()].filter(([category]) => isUncategorizedCategory(category));
  if (uncategorizedEntries.length > 0) {
    const category = uncategorizedEntries[0][0];
    const currentAmount = uncategorizedEntries.reduce((sum, [, amount]) => sum + amount, 0);
    const shareOfSpend = currentAmount / currentTotal;

    if (shareOfSpend >= UNCATEGORIZED_SPEND_SHARE_THRESHOLD) {
      return { kind: 'uncategorized-spend', category, currentAmount, shareOfSpend };
    }
  }

  // A category trend is not trustworthy until there is a comparable baseline.
  if (previousTotal <= 0) {
    return null;
  }

  const minimumChangeAmount = Math.max(100, currentTotal * 0.03);
  const candidates = [...currentTotals.entries()]
    .map(([category, currentAmount]) => {
      const previousAmount = previousTotals.get(category) ?? 0;
      const changeAmount = currentAmount - previousAmount;
      const changePercent = previousAmount > 0 ? (changeAmount / previousAmount) * 100 : null;
      const direction = previousAmount === 0 ? 'new' : changeAmount >= 0 ? 'up' : 'down';

      return { category, currentAmount, previousAmount, changeAmount, changePercent, direction } as const;
    })
    .filter((candidate) => {
      if (candidate.direction === 'new') {
        return candidate.currentAmount >= minimumChangeAmount;
      }

      return (
        Math.abs(candidate.changeAmount) >= minimumChangeAmount &&
        Math.abs(candidate.changePercent ?? 0) >= MINIMUM_TREND_PERCENT
      );
    })
    .sort((first, second) => Math.abs(second.changeAmount) - Math.abs(first.changeAmount));

  const trend = candidates[0];
  if (!trend) {
    return null;
  }

  return {
    kind: 'category-change',
    category: trend.category,
    currentAmount: trend.currentAmount,
    previousAmount: trend.previousAmount,
    changeAmount: trend.changeAmount,
    changePercent: trend.changePercent,
    direction: trend.direction,
  };
};

export const buildCategoryBudgetCards = (
  categoryTotals: CategoryTotal[],
  categoryLimits: Record<string, number> = {}
): DashboardCategoryCard[] => {
  const spentMap = new Map(categoryTotals.map((item) => [item.category, item.total]));

  return EXPENSE_CATEGORIES
    .map((categoryDef) => {
      const category = categoryDef.id;
      const spent = spentMap.get(category) ?? 0;
      const budget = Math.max(0, Math.round(categoryLimits[category] ?? 0));
      const progress = budget > 0 ? clamp((spent / budget) * 100, 0, 999) : spent > 0 ? 100 : 0;

      return {
        category,
        name: categoryDef?.name ?? category,
        icon: categoryDef?.icon ?? 'tag-outline',
        color: categoryDef?.color ?? '#6B7280',
        spent,
        budget,
        progress,
      };
    })
    .filter((card) => card.spent > 0 || card.budget > 0)
    .sort((a, b) => b.spent - a.spent);
};

export const buildDashboardInsight = (
  currentSpent: number,
  previousSpent: number,
  monthlyAllowance: number
): DashboardInsight => {
  if (monthlyAllowance <= 0) {
    return {
      title: 'Set your monthly budget',
      body: 'Add a monthly budget to unlock a useful spending comparison for this dashboard.',
      icon: 'wallet-outline',
      tone: 'info',
    };
  }

  if (currentSpent > monthlyAllowance) {
    return {
      title: 'Budget exceeded',
      body: `You are ${formatCurrency(currentSpent - monthlyAllowance)} over budget this month. Tightening a few categories now can help.`,
      icon: 'alert-circle-outline',
      tone: 'warning',
    };
  }

  if (previousSpent > 0 && currentSpent < previousSpent) {
    return {
      title: 'Nice progress',
      body: `You spent ${formatCurrency(previousSpent - currentSpent)} less than last month. Keep the momentum going.`,
      icon: 'trending-up',
      tone: 'positive',
    };
  }

  return {
    title: 'Steady pace',
    body: 'Your spending looks steady. Keep tracking the categories that move fastest.',
    icon: 'lightbulb-on-outline',
    tone: 'info',
  };
};

export const buildSavingsGoalSnapshot = (
  activeChallenge: Challenge | undefined,
  monthlyAllowance: number,
  projectedSavings: number
): SavingsGoalSnapshot => {
  if (activeChallenge) {
    const template = CHALLENGE_TEMPLATES.find(
      (item) => item.name === activeChallenge.name || item.category === activeChallenge.category
    );
    const target = template?.estimatedSavings ?? Math.max(1, activeChallenge.savings_earned || monthlyAllowance);
    const current = Math.max(
      0,
      activeChallenge.savings_earned || Math.round(target * (activeChallenge.current_streak / Math.max(1, activeChallenge.duration_days)))
    );

    return {
      title: activeChallenge.name,
      subtitle: 'Active savings challenge',
      current,
      target,
      progress: target > 0 ? clamp((current / target) * 100, 0, 100) : 0,
      icon: template?.icon ?? 'target',
      color: template?.color ?? '#111111',
    };
  }

  const current = Math.max(0, projectedSavings);
  const target = Math.max(current, monthlyAllowance, 1);

  return {
    title: 'This Month\'s Savings',
    subtitle: 'Based on your current spending pattern',
    current,
    target,
    progress: clamp((current / target) * 100, 0, 100),
    icon: 'piggy-bank-outline',
    color: '#111111',
  };
};
