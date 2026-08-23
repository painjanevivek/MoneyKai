import type { FinancePeriod, FinancePeriodProgress, FinanceSummary } from './financeCore';
import { formatCurrency } from './formatCurrency';
import type { GuardedInsightCard, InsightEvidenceCode, InsightProvenance } from '@/types/insight';

export type Insight = GuardedInsightCard;

export interface DeterministicInsightInput {
  monthlyAllowance: number;
  current: FinanceSummary;
  previous?: FinanceSummary;
  period: FinancePeriod;
  progress: FinancePeriodProgress;
}

const RULE_VERSION = 'v1';

const provenance = (
  evidenceCode: InsightEvidenceCode,
  period: FinancePeriod,
  ruleId: string,
  recordCount?: number,
): InsightProvenance => ({
  source: evidenceCode === 'monthly_allowance' ? 'budget_settings' : 'reviewed_transactions',
  evidenceCode,
  period: period.startDate.slice(0, 7),
  recordCount,
  ruleId: `${ruleId}.${RULE_VERSION}`,
});

export const generateDeterministicInsights = ({
  monthlyAllowance,
  current,
  previous,
  period,
  progress,
}: DeterministicInsightInput): GuardedInsightCard[] => {
  if (current.count === 0 && (!previous || previous.count === 0)) return [];

  const cards: GuardedInsightCard[] = [];
  const periodLabel = period.startDate.slice(0, 7);
  const expenseRate = monthlyAllowance > 0 ? current.expense / monthlyAllowance : 0;
  const elapsedRate = progress.totalDays > 0 ? progress.daysPassed / progress.totalDays : 0;

  if (monthlyAllowance > 0 && progress.isOpen && expenseRate > elapsedRate + 0.12) {
    const delta = Math.max(0, current.expense - monthlyAllowance * elapsedRate);
    cards.push({
      id: 'budget_pace_ahead',
      tone: 'warning',
      title: 'Spending is ahead of the monthly pace',
      body: 'Reviewed expenses are using the monthly allowance faster than the elapsed share of the period.',
      metricLabel: 'Ahead of even pace',
      metricValue: formatCurrency(delta),
      caveat: 'Even pace is a simple guardrail and does not account for planned one-off expenses.',
      provenance: [
        provenance('total_spent', period, 'budget.pace', current.count),
        provenance('monthly_allowance', period, 'budget.pace'),
        provenance('period_progress', period, 'budget.pace'),
      ],
      actions: [{ label: 'Review budget', href: '/budgets' }],
      generatedBy: 'deterministic',
    });
  }

  if (current.income > 0 && current.expense > current.income) {
    cards.push({
      id: 'expense_above_income',
      tone: 'warning',
      title: 'Reviewed spending is above reviewed income',
      body: 'Expenses recorded in this period exceed the income records in the same period.',
      metricLabel: 'Tracked gap',
      metricValue: formatCurrency(current.expense - current.income),
      caveat: 'This compares reviewed records only and is not a bank-balance statement.',
      provenance: [
        provenance('total_spent', period, 'cashflow.expense_above_income', current.count),
        provenance('total_income', period, 'cashflow.expense_above_income', current.count),
      ],
      actions: [{ label: 'View reports', href: '/reports' }],
      generatedBy: 'deterministic',
    });
  }

  if (previous && previous.expense > 0) {
    const change = ((current.expense - previous.expense) / previous.expense) * 100;
    if (Math.abs(change) >= 12) {
      cards.push({
        id: change > 0 ? 'monthly_expense_increase' : 'monthly_expense_decrease',
        tone: change > 0 ? 'warning' : 'success',
        title: change > 0 ? 'Reviewed spending increased' : 'Reviewed spending decreased',
        body: `Expense totals are ${Math.round(Math.abs(change))}% ${change > 0 ? 'higher' : 'lower'} than the adjacent previous period.`,
        metricLabel: 'Period change',
        metricValue: `${change > 0 ? '+' : '-'}${Math.round(Math.abs(change))}%`,
        caveat: 'The totals show what changed, not why it changed or whether the pattern will continue.',
        provenance: [
          provenance('total_spent', period, 'cashflow.period_change', current.count),
          provenance('previous_month_spent', period, 'cashflow.period_change', previous.count),
        ],
        actions: [{ label: 'View reports', href: '/reports' }],
        generatedBy: 'deterministic',
      });
    }
  }

  const topCategory = current.categories[0];
  if (topCategory && topCategory.percentage >= 35) {
    cards.push({
      id: `top_category_${topCategory.category}`,
      tone: 'info',
      title: `${humanize(topCategory.category)} is the largest category`,
      body: `It represents ${Math.round(topCategory.percentage)}% of reviewed expenses in ${periodLabel}.`,
      metricLabel: 'Reviewed amount',
      metricValue: formatCurrency(topCategory.total),
      caveat: 'Category share depends on the accuracy of reviewed classifications.',
      provenance: [provenance('category_totals', period, 'category.top_share', current.count)],
      actions: [{ label: 'Open daily review', href: '/review' }],
      generatedBy: 'deterministic',
    });
  }

  if (topCategory && topCategory.total >= 500) {
    const scenario = Math.round(topCategory.total * 0.2);
    cards.push({
      id: `category_scenario_${topCategory.category}`,
      tone: 'info',
      title: `Explore a ${humanize(topCategory.category)} reduction scenario`,
      body: 'The savings planner can model a 20% reduction without changing your budget or transactions.',
      metricLabel: '20% scenario',
      metricValue: formatCurrency(scenario),
      caveat: 'This is a mathematical scenario, not a forecast or personalized recommendation.',
      provenance: [provenance('category_totals', period, 'category.reduction_scenario', current.count)],
      actions: [{ label: 'Open savings plan', href: '/savings' }],
      generatedBy: 'deterministic',
    });
  }

  return cards.slice(0, 5);
};

const humanize = (value: string) => value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export const getDailyMotivation = (totalSpent: number, dailyBudget: number): string => {
  if (totalSpent === 0) return 'New day, clean slate! Track every expense today.';
  if (totalSpent < dailyBudget * 0.5) return 'Excellent start to the day! You are well within budget.';
  if (totalSpent < dailyBudget) return 'Good going! Still within your daily limit.';
  if (totalSpent < dailyBudget * 1.2) return 'Slightly over budget today - try to slow down.';
  return 'Over budget today! Every extra rupee adds up. Try a no-spend evening.';
};
