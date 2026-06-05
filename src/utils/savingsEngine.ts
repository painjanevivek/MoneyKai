import type { CategoryReduction, SavingsProjection } from '../types/budget';
import type { CategoryTotal } from '../types/transaction';
import { getDaysLeftInMonth, getDaysPassed, getDaysInCurrentMonth } from './dateUtils';

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

  // Current daily average
  const currentDailyAvg = daysPassed > 0 ? totalSpent / daysPassed : 0;

  // Calculate savings from reductions
  let totalSavedFromReductions = 0;
  const recommendations: string[] = [];

  reductions.forEach(reduction => {
    if (reduction.reductionPercent > 0) {
      const projectedCategorySpend = (reduction.currentAmount / daysPassed) * totalDays;
      const savedAmount = projectedCategorySpend * (reduction.reductionPercent / 100);
      totalSavedFromReductions += savedAmount;
      reduction.savedAmount = Math.round(savedAmount);

      // Generate recommendation
      if (savedAmount > 500) {
        const categoryName = reduction.category.charAt(0).toUpperCase() + reduction.category.slice(1);
        recommendations.push(
          `Reducing ${categoryName} by ${reduction.reductionPercent}% could save ₹${Math.round(savedAmount).toLocaleString('en-IN')} this month.`
        );
      }
    }
  });

  // Project remaining spending with reductions
  const reducedDailyRate = Math.max(0, currentDailyAvg - (totalSavedFromReductions / totalDays));
  const projectedTotalSpend = totalSpent + (reducedDailyRate * daysLeft);
  const projectedSavings = monthlyAllowance + additionalIncome - projectedTotalSpend;

  // Current trajectory (without reductions)
  const currentProjectedSpend = totalSpent + (currentDailyAvg * daysLeft);
  const currentSavings = monthlyAllowance + additionalIncome - currentProjectedSpend;

  const improvement = projectedSavings - currentSavings;
  const improvementPercent = currentSavings !== 0
    ? (improvement / Math.abs(currentSavings)) * 100
    : improvement > 0 ? 100 : 0;

  // Add general recommendations
  if (currentDailyAvg > monthlyAllowance / totalDays) {
    recommendations.push('Your daily spending exceeds your daily budget. Consider cutting non-essential expenses.');
  }
  if (daysLeft > 0 && projectedSavings > 0) {
    recommendations.push(`You can safely spend ₹${Math.round(projectedSavings / daysLeft).toLocaleString('en-IN')} per day for the rest of the month.`);
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
export const calculateBudgetHealth = (
  monthlyAllowance: number,
  totalSpent: number,
): { score: number; label: string; color: string; message: string } => {
  if (monthlyAllowance <= 0) return { score: 0, label: 'No Budget', color: '#6B7280', message: 'Set your monthly allowance to get started.' };

  const daysPassed = getDaysPassed();
  const totalDays = getDaysInCurrentMonth();
  const expectedSpendRate = daysPassed / totalDays;
  const actualSpendRate = totalSpent / monthlyAllowance;

  // Score: 100 = spending nothing, 0 = exceeded budget
  // Adjusted for time in month
  const ratio = actualSpendRate / Math.max(expectedSpendRate, 0.01);
  const score = Math.max(0, Math.min(100, Math.round((1 - (ratio - 0.5)) * 100)));

  if (score >= 80) return { score, label: 'Excellent', color: '#22C55E', message: "Outstanding! You're well under budget." };
  if (score >= 60) return { score, label: 'Good', color: '#0D8C4C', message: "You're doing great! Keep tracking to improve savings." };
  if (score >= 40) return { score, label: 'Fair', color: '#F59E0B', message: 'Watch your spending. Consider reducing non-essentials.' };
  if (score >= 20) return { score, label: 'Poor', color: '#F4A261', message: 'Spending is high. Emergency mode recommended.' };
  return { score, label: 'Critical', color: '#FF5A5A', message: 'Budget exceeded! Activate Emergency Mode immediately.' };
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
  const essentialBudget = Math.round(dailyLimit * 0.7); // 70% for essentials

  const suggestions: string[] = [];

  if (dailyLimit < 200) {
    suggestions.push('Cook at home instead of ordering food.');
    suggestions.push('Use public transport instead of cabs.');
    suggestions.push('Avoid all non-essential purchases.');
  } else if (dailyLimit < 500) {
    suggestions.push('Reduce food delivery frequency to once a week.');
    suggestions.push('Walk or cycle for short distances.');
    suggestions.push('Postpone any shopping to next month.');
  } else {
    suggestions.push('You have a reasonable daily budget — stick to it!');
    suggestions.push('Avoid impulsive spending on weekends.');
  }

  suggestions.push('Track every expense, no matter how small.');

  return { dailyLimit, essentialBudget, suggestions };
};
