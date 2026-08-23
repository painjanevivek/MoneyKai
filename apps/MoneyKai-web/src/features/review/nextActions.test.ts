import { describe, expect, it } from 'vitest';
import { buildDashboardNextActions } from './nextActions';
import type { ReviewItem } from '@/types/review';

const review = {
  id: 'review-1', title: 'Confirm an expense', summary: 'Rail ticket', reasonCode: 'reconciliation_new_transaction',
  priority: 'high', evidence: [{ code: 'amount', label: 'Amount', value: 'INR 850.00' }],
} as ReviewItem;

describe('buildDashboardNextActions', () => {
  it('prioritizes explainable review work and preserves its deep-link context', () => {
    const actions = buildDashboardNextActions({ reviews: [review], allowance: 10_000, budgetUsage: 25, transactionCount: 4 });
    expect(actions[0]).toMatchObject({ title: 'Confirm an expense', status: 'Review', tone: 'warning' });
    expect(actions[0].href).toBe('/review?status=pending&item=review-1');
    expect(actions[0].body).toContain('reconciliation new transaction');
  });

  it('falls back to a truthful digest action when no intervention is needed', () => {
    const actions = buildDashboardNextActions({ reviews: [], allowance: 10_000, budgetUsage: 25, transactionCount: 4 });
    expect(actions).toEqual([expect.objectContaining({ title: 'Review the monthly digest', tone: 'success' })]);
  });
});
