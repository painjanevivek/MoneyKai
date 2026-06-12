import { describe, expect, it } from 'vitest';
import {
  getMonthCategoryTotals,
  getMonthExpenses,
  getMonthIncome,
  getMonthNet,
  getMonthTransactionsNewestFirst,
} from '@/utils/monthAnalytics';
import type { Transaction } from '@/types/transaction';

const transactions: Transaction[] = [
  {
    id: '1',
    user_id: 'local',
    type: 'expense',
    amount: 300,
    category: 'food',
    description: 'Dinner',
    payment_method: 'upi',
    transaction_date: '2026-06-10',
    created_at: '2026-06-10T10:00:00.000Z',
  },
  {
    id: '2',
    user_id: 'local',
    type: 'income',
    amount: 1000,
    category: 'income',
    description: 'Salary',
    payment_method: 'bank',
    transaction_date: '2026-06-08',
    created_at: '2026-06-08T10:00:00.000Z',
  },
  {
    id: '3',
    user_id: 'local',
    type: 'expense',
    amount: 200,
    category: 'transport',
    description: 'Metro',
    payment_method: 'upi',
    transaction_date: '2026-05-30',
    created_at: '2026-05-30T10:00:00.000Z',
  },
  {
    id: '4',
    user_id: 'local',
    type: 'expense',
    amount: 150,
    category: 'food',
    description: 'Lunch',
    payment_method: 'upi',
    transaction_date: '2026-06-11',
    created_at: '2026-06-11T10:00:00.000Z',
  },
];

describe('month analytics', () => {
  it('filters selected month transactions newest first', () => {
    expect(getMonthTransactionsNewestFirst(transactions, '2026-06').map((transaction) => transaction.id)).toEqual([
      '4',
      '1',
      '2',
    ]);
  });

  it('calculates selected month income, expenses, net, and category totals', () => {
    expect(getMonthExpenses(transactions, '2026-06')).toBe(450);
    expect(getMonthIncome(transactions, '2026-06')).toBe(1000);
    expect(getMonthNet(transactions, '2026-06')).toBe(550);
    expect(getMonthCategoryTotals(transactions, '2026-06')).toEqual([
      expect.objectContaining({ category: 'food', total: 450, count: 2, percentage: 100 }),
    ]);
  });
});
