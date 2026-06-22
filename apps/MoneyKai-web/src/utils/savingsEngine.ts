import type { CategoryReduction, SavingsProjection } from '../types/budget';
import type { CategoryTotal } from '../types/transaction';
import type { ColorScheme } from '../constants/theme';
import { getDaysLeftInMonth, getDaysPassed, getDaysInCurrentMonth } from './dateUtils';
import { formatCurrency } from './formatCurrency';

/**
 * Savings Prediction Engine
 *
 * Calculates projected savings based on category reduction sliders.
 * Uses current spending patterns to forecast month-end balance.
 */

export const calculateSavingsProjection = (
  monthlyAllowance: number,
  categoryTotals: CategoryTotal[],
  reductions: CategoryReduction[],
  additionalIncome: number = 0
): SavingsProjection => {
  const totalSpent = categoryTotals.reduce((sum, c) => sum + c.total, 0);
  const daysPassed = getDaysPassed();
  const daysLeft = getDaysLeftInMonth();
  const totalDays = getDaysInCurrentMonth();

  const currentDailyAvg = daysPassed > 0 ? totalSpent / daysPassed : 0;

  let totalSavedFromReductions = 0;
  const recommendations: string[] = [];

  reductions.forEach((reduction) => {
    if (reduction.reductionPercent > 0) {
      const projectedCategorySpend = (reduction.currentAmount / daysPassed) * totalDays;
      const savedAmount = projectedCategorySpend * (reduction.reductionPercent / 100);
      totalSavedFromReductions += savedAmount;
      reduction.savedAmount = Math.round(savedAmount);

      if (savedAmount > 500) {
        const categoryName = reduction.category.charAt(0).toUpperCase() + reduction.category.slice(1);
        recommendations.push(
          `Reducing ${categoryName} by ${reduction.reductionPercent}% could save ${formatCurrency(savedAmount)} this month.`
        );
      }
    }
  });

  const reducedDailyRate = Math.max(0, currentDailyAvg - (totalSavedFromReductions / totalDays));
  const projectedTotalSpend = totalSpent + (reducedDailyRate * daysLeft);
  const projectedSavings = monthlyAllowance + additionalIncome - projectedTotalSpend;

  const currentProjectedSpend = totalSpent + (currentDailyAvg * daysLeft);
  const currentSavings = monthlyAllowance + additionalIncome - currentProjectedSpend;

  const improvement = projectedSavings - currentSavings;
  const improvementPercent = currentSavings !== 0
    ? (improvement / Math.abs(currentSavings)) * 100
    : improvement > 0 ? 100 : 0;

  if (currentDailyAvg > monthlyAllowance / totalDays) {
    recommendations.push('Your daily spending is running ahead of your budget. Try trimming a few non-essential expenses.');
  }
  if (daysLeft > 0 && projectedSavings > 0) {
    recommendations.push(`A comfortable daily spend for the rest of the month is ${formatCurrency(projectedSavings / daysLeft)}.`);
  }

  return {
    currentSavings: Math.round(currentSavings),
    projectedSavings: Math.round(projectedSavings),
    improvement: Math.round(improvement),
    improvementPercent: Math.round(improvementPercent * 10) / 10,
    newDailyLimit: Math.round((monthlyAllowance + additionalIncome - totalSpent) / Math.max(1, daysLeft)),
    newMonthEndBalance: Math.round(projectedSavings),
    recommendations,
  };
};

/**
 * Calculate budget health score (0-100)
 */

type BudgetHealthLevel = 'empty' | 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

const BUDGET_HEALTH_FALLBACK_COLORS: Record<BudgetHealthLevel, string> = {
  empty: '#6B7280',
  excellent: '#10B981',
  good: '#2563EB',
  fair: '#F59E0B',
  poor: '#F97316',
  critical: '#EF4444',
};

export const getBudgetHealthColor = (level: BudgetHealthLevel, colors: ColorScheme): string => {
  const themedColors: Record<BudgetHealthLevel, string> = {
    empty: colors.textTertiary,
    excellent: colors.accent,
    good: colors.primary,
    fair: colors.chart3,
    poor: colors.chart5,
    critical: colors.emergency,
  };

  return themedColors[level] ?? BUDGET_HEALTH_FALLBACK_COLORS[level];
};

export const calculateBudgetHealth = (
  monthlyAllowance: number,
  totalSpent: number,
): { score: number; level: BudgetHealthLevel; label: string; color: string; message: string } => {
  if (monthlyAllowance <= 0) {
    return { score: 0, level: 'empty', label: 'No Budget', color: BUDGET_HEALTH_FALLBACK_COLORS.empty, message: 'Set your monthly budget to get started.' };
  }

  const daysPassed = getDaysPassed();
  const totalDays = getDaysInCurrentMonth();
  const expectedSpendRate = daysPassed / totalDays;
  const actualSpendRate = totalSpent / monthlyAllowance;

  const ratio = actualSpendRate / Math.max(expectedSpendRate, 0.01);
  const score = Math.max(0, Math.min(100, Math.round((1 - (ratio - 0.5)) * 100)));

  if (score >= 80) return { score, level: 'excellent', label: 'Excellent', color: BUDGET_HEALTH_FALLBACK_COLORS.excellent, message: "You're in a great spot this month." };
  if (score >= 60) return { score, level: 'good', label: 'Good', color: BUDGET_HEALTH_FALLBACK_COLORS.good, message: 'Things are on track. Keep going.' };
  if (score >= 40) return { score, level: 'fair', label: 'Fair', color: BUDGET_HEALTH_FALLBACK_COLORS.fair, message: 'Spending is a little high. A few small cuts could help.' };
  if (score >= 20) return { score, level: 'poor', label: 'Poor', color: BUDGET_HEALTH_FALLBACK_COLORS.poor, message: 'Spending is rising fast. Emergency mode may help.' };
  return { score, level: 'critical', label: 'Critical', color: BUDGET_HEALTH_FALLBACK_COLORS.critical, message: 'You have gone past budget. Emergency mode is a good next step.' };
};

/**
 * Calculate emergency mode budget
 */
export const calculateEmergencyBudget = (
  remainingBalance: number,
  daysLeft: number
): {
  dailyLimit: number;
  essentialBudget: number;
  suggestions: string[];
} => {
  const dailyLimit = Math.max(0, Math.round(remainingBalance / Math.max(1, daysLeft)));
  const essentialBudget = Math.round(dailyLimit * 0.7);

  const suggestions: string[] = [];

  if (dailyLimit < 200) {
    suggestions.push('Cook at home instead of ordering food.');
    suggestions.push('Use public transport instead of cabs.');
    suggestions.push('Pause any non-essential purchases for now.');
  } else if (dailyLimit < 500) {
    suggestions.push('Cut food delivery back to once or twice a week.');
    suggestions.push('Walk or cycle for short distances.');
    suggestions.push('Hold off on shopping until next month.');
  } else {
    suggestions.push('You have a comfortable daily budget. Stick to it.');
    suggestions.push('Avoid impulsive spending on weekends.');
  }

  suggestions.push('Track every expense, even the small ones.');

  return { dailyLimit, essentialBudget, suggestions };
};
