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
