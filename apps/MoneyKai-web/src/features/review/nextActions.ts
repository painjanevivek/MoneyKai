import type { ReviewItem } from '@/types/review';

export interface DashboardNextAction {
  icon: 'clipboard-alert-outline' | 'wallet-outline' | 'receipt-text-plus-outline' | 'file-chart-outline';
  title: string;
  body: string;
  status: string;
  tone: 'primary' | 'warning' | 'success' | 'neutral';
  href: string;
}

interface Inputs {
  reviews: ReviewItem[];
  allowance: number;
  budgetUsage: number;
  transactionCount: number;
}

export function buildDashboardNextActions({ reviews, allowance, budgetUsage, transactionCount }: Inputs): DashboardNextAction[] {
  const actions: DashboardNextAction[] = reviews.slice(0, 2).map((review) => ({
    icon: 'clipboard-alert-outline',
    title: review.title,
    body: `${review.summary} · ${review.evidence[0]?.value ?? 'Evidence available'}. It appears because ${review.reasonCode.replaceAll('_', ' ')}.`,
    status: review.priority === 'critical' ? 'Urgent' : 'Review',
    tone: review.priority === 'critical' || review.priority === 'high' ? 'warning' : 'primary',
    href: `/review?status=pending&item=${encodeURIComponent(review.id)}`,
  }));

  if (allowance <= 0) {
    actions.push({ icon: 'wallet-outline', title: 'Set a monthly budget', body: 'A budget is needed before MoneyKai can explain spending pressure.', status: 'Set up', tone: 'neutral', href: '/budgets' });
  } else if (budgetUsage >= 80) {
    actions.push({ icon: 'wallet-outline', title: 'Review budget pressure', body: `${Math.round(budgetUsage)}% of the monthly budget is used, so the remaining plan deserves a check.`, status: budgetUsage > 100 ? 'Over' : 'Watch', tone: 'warning', href: '/budgets' });
  }

  if (transactionCount === 0) {
    actions.push({ icon: 'receipt-text-plus-outline', title: 'Add the first money record', body: 'Reports and planning remain empty until at least one reviewed record exists.', status: 'Start', tone: 'neutral', href: '/transactions?add=true' });
  }

  if (actions.length === 0) {
    actions.push({ icon: 'file-chart-outline', title: 'Review the monthly digest', body: 'No unresolved evidence is waiting. Reports are ready for a broader pattern check.', status: 'Ready', tone: 'success', href: '/reports' });
  }
  return actions.slice(0, 4);
}
