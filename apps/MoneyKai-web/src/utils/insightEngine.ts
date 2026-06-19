import type { CategoryTotal } from '../types/transaction';
import { getDaysPassed } from './dateUtils';
import { formatCurrency } from './formatCurrency';

export interface Insight {
  id: string;
  icon: string;
  message: string;
  type: 'tip' | 'warning' | 'achievement' | 'trend';
  priority: number;
  actionLabel?: string;
}

/**
 * Rule-based insight engine
 */
export const generateInsights = (
  monthlyAllowance: number,
  totalSpent: number,
  categoryTotals: CategoryTotal[],
  previousMonthTotals?: CategoryTotal[],
  previousMonthSpent?: number,
): Insight[] => {
  const insights: Insight[] = [];
  const hasSpendingHistory = totalSpent > 0 || categoryTotals.length > 0 || (previousMonthSpent ?? 0) > 0;

  if (!hasSpendingHistory) {
    return insights;
  }

  const daysPassed = getDaysPassed();
  const dailyAvg = daysPassed > 0 ? totalSpent / daysPassed : 0;
  const budgetDailyLimit = monthlyAllowance / 30;
  const spendRate = monthlyAllowance > 0 ? (totalSpent / monthlyAllowance) * 100 : 0;

  const now = new Date();
  const dayOfWeek = now.getDay();
  if ((dayOfWeek === 0 || dayOfWeek === 6) && totalSpent > 0) {
    insights.push({
      id: 'weekend_alert',
      icon: 'calendar-weekend',
      message: 'You spend most on food during weekends.',
      type: 'tip',
      priority: 2,
    });
  }

  if (previousMonthTotals) {
    categoryTotals.forEach((current) => {
      const prev = previousMonthTotals.find((p) => p.category === current.category);
      if (prev && prev.total > 0) {
        const change = ((current.total - prev.total) / prev.total) * 100;
        if (change > 15) {
          const catName = current.category.charAt(0).toUpperCase() + current.category.slice(1);
          insights.push({
            id: `trend_${current.category}`,
            icon: 'trending-up',
            message: `Your ${catName} spending increased by ${Math.round(change)}%.`,
            type: 'warning',
            priority: 1,
          });
        } else if (change < -15) {
          const catName = current.category.charAt(0).toUpperCase() + current.category.slice(1);
          insights.push({
            id: `trend_${current.category}_down`,
            icon: 'trending-down',
            message: `Great! ${catName} spending decreased by ${Math.round(Math.abs(change))}%.`,
            type: 'achievement',
            priority: 3,
          });
        }
      }
    });
  }

  if (previousMonthSpent && previousMonthSpent > 0) {
    const prevRate = previousMonthSpent / monthlyAllowance;
    const currRate = totalSpent / monthlyAllowance;
    if (currRate < prevRate * 0.9) {
      insights.push({
        id: 'savings_improved',
        icon: 'chart-line',
        message: 'Your savings rate improved this month! Keep it up.',
        type: 'achievement',
        priority: 2,
      });
    }
  }

  if (spendRate > 80 && daysPassed < 25) {
    insights.push({
      id: 'budget_warning',
      icon: 'alert-circle-outline',
      message: "You've spent 80% of your budget with days remaining. Consider Emergency Mode.",
      type: 'warning',
      priority: 1,
      actionLabel: 'Activate SOS',
    });
  }

  if (totalSpent > 0 && dailyAvg > budgetDailyLimit * 1.2) {
    insights.push({
      id: 'daily_overspend',
      icon: 'speedometer',
      message: `Daily average (${formatCurrency(dailyAvg)}) exceeds your safe limit.`,
      type: 'warning',
      priority: 1,
    });
  }

  if (categoryTotals.length > 0) {
    const sorted = [...categoryTotals].sort((a, b) => b.total - a.total);
    const top = sorted[0];
    if (top && top.percentage > 30) {
      insights.push({
        id: 'top_category',
        icon: 'podium-gold',
        message: `${top.category.charAt(0).toUpperCase() + top.category.slice(1)} is your biggest expense at ${Math.round(top.percentage)}%.`,
        type: 'tip',
        priority: 3,
      });
    }

    if (top && top.total > 500) {
      const saveable = Math.round(top.total * 0.2);
      insights.push({
        id: 'savings_tip',
        icon: 'lightbulb-on-outline',
        message: `You can save up to ${formatCurrency(saveable)} if you reduce ${top.category} by 20%.`,
        type: 'tip',
        priority: 2,
        actionLabel: 'View Predictor',
      });
    }
  }

  return insights.sort((a, b) => a.priority - b.priority).slice(0, 5);
};

export const getDailyMotivation = (totalSpent: number, dailyBudget: number): string => {
  if (totalSpent === 0) return 'New day, clean slate! Track every expense today.';
  if (totalSpent < dailyBudget * 0.5) return 'Excellent start to the day! You are well within budget.';
  if (totalSpent < dailyBudget) return 'Good going! Still within your daily limit.';
  if (totalSpent < dailyBudget * 1.2) return 'Slightly over budget today - try to slow down.';
  return 'Over budget today! Every extra rupee adds up. Try a no-spend evening.';
};
