import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types/transaction';
import {
  buildSpendingTrendInsight,
  filterComparablePreviousMonthTransactions,
} from './dashboard';

const transaction = (
  overrides: Partial<Transaction> & Pick<Transaction, 'id' | 'amount' | 'category' | 'transaction_date'>
): Transaction => ({
  id: overrides.id,
  user_id: 'user-1',
  type: 'expense',
  amount: overrides.amount,
  category: overrides.category,
  description: 'Test transaction',
  payment_method: 'upi',
  transaction_date: overrides.transaction_date,
  created_at: overrides.transaction_date,
  ...overrides,
});

describe('buildSpendingTrendInsight', () => {
  it('selects the largest meaningful category movement and keeps percentage as context', () => {
    const insight = buildSpendingTrendInsight(
      [transaction({ id: 'current-transport', category: 'transport', amount: 5167, transaction_date: '2026-08-12' })],
      [transaction({ id: 'previous-transport', category: 'transport', amount: 4035, transaction_date: '2026-07-12' })]
    );

    expect(insight).toMatchObject({
      kind: 'category-change',
      category: 'transport',
      direction: 'up',
      changeAmount: 1132,
    });
    expect((insight?.kind === 'category-change' ? insight.changePercent : null) ?? 0).toBeCloseTo(28.05, 1);
  });

  it('flags a dominant uncategorized category before a normal trend', () => {
    const insight = buildSpendingTrendInsight(
      [
        transaction({ id: 'other', category: 'others', amount: 16216, transaction_date: '2026-08-12' }),
        transaction({ id: 'transport', category: 'transport', amount: 5167, transaction_date: '2026-08-12' }),
      ],
      [transaction({ id: 'previous', category: 'transport', amount: 4035, transaction_date: '2026-07-12' })]
    );

    expect(insight).toMatchObject({ kind: 'uncategorized-spend', category: 'others', currentAmount: 16216 });
  });

  it('does not invent a category trend without a prior spending baseline', () => {
    expect(
      buildSpendingTrendInsight(
        [transaction({ id: 'current', category: 'transport', amount: 5167, transaction_date: '2026-08-12' })],
        []
      )
    ).toBeNull();
  });

  it('surfaces a meaningful decrease as a positive trend', () => {
    const insight = buildSpendingTrendInsight(
      [transaction({ id: 'current-food', category: 'food', amount: 2400, transaction_date: '2026-08-12' })],
      [transaction({ id: 'previous-food', category: 'food', amount: 4000, transaction_date: '2026-07-12' })]
    );

    expect(insight).toMatchObject({
      kind: 'category-change',
      category: 'food',
      direction: 'down',
      changeAmount: -1600,
    });
  });

  it('labels a sufficiently material first-time category as new', () => {
    const insight = buildSpendingTrendInsight(
      [transaction({ id: 'current-health', category: 'healthcare', amount: 1200, transaction_date: '2026-08-12' })],
      [transaction({ id: 'previous-food', category: 'food', amount: 4000, transaction_date: '2026-07-12' })]
    );

    expect(insight).toMatchObject({
      kind: 'category-change',
      category: 'healthcare',
      direction: 'new',
      changePercent: null,
    });
  });
});

describe('filterComparablePreviousMonthTransactions', () => {
  it('uses the same elapsed days when comparing the current month', () => {
    const comparable = filterComparablePreviousMonthTransactions(
      [
        transaction({ id: 'included', category: 'food', amount: 100, transaction_date: '2026-07-12' }),
        transaction({ id: 'excluded', category: 'food', amount: 100, transaction_date: '2026-07-13' }),
      ],
      '2026-08',
      new Date(2026, 7, 12)
    );

    expect(comparable.map((item) => item.id)).toEqual(['included']);
  });
});
