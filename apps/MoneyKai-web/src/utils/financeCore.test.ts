import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/types/transaction';
import { financePeriodProgress, monthFinancePeriod, previousFinancePeriod, summarizeTransactions } from './financeCore';

const transaction = (id: string, type: 'income' | 'expense', amount: number, date: string, category: string): Transaction => ({
  id, user_id: 'finance-core-user', type, amount, transaction_date: date, category, description: id, payment_method: 'cash', created_at: `${date}T00:00:00Z`,
});

describe('canonical finance calculations', () => {
  const fixture = [
    transaction('salary', 'income', 50_000, '2026-08-01', 'income'),
    transaction('rent', 'expense', 20_000, '2026-08-01', 'rent'),
    transaction('food-1', 'expense', 1_250, '2026-08-31', 'food'),
    transaction('food-2', 'expense', 750, '2026-08-12', 'food'),
    transaction('boundary', 'expense', 999, '2026-09-01', 'other'),
    transaction('bad-date', 'expense', 500, '2026-08-40', 'other'),
    transaction('bad-amount', 'expense', Number.NaN, '2026-08-12', 'other'),
  ];

  it('uses date-only half-open periods and one category definition', () => {
    const summary = summarizeTransactions(fixture, { period: monthFinancePeriod(new Date(2026, 7, 15)) });
    expect(summary).toMatchObject({ income: 50_000, expense: 22_000, net: 28_000, count: 4, invalidCount: 2 });
    expect(summary.categories).toEqual([
      { category: 'rent', total: 20_000, count: 1, percentage: (20_000 / 22_000) * 100 },
      { category: 'food', total: 2_000, count: 2, percentage: (2_000 / 22_000) * 100 },
    ]);
  });

  it('builds an adjacent previous period with no overlap', () => {
    expect(previousFinancePeriod({ startDate: '2026-08-01', endDateExclusive: '2026-09-01' })).toEqual({
      startDate: '2026-07-01',
      endDateExclusive: '2026-08-01',
    });
  });

  it('calculates deterministic open and closed period progress', () => {
    const period = { startDate: '2026-08-01', endDateExclusive: '2026-09-01' };
    expect(financePeriodProgress(period, new Date(2026, 7, 24, 12))).toEqual({
      daysPassed: 24,
      daysLeft: 7,
      totalDays: 31,
      isOpen: true,
    });
    expect(financePeriodProgress(period, new Date(2026, 8, 1, 12))).toEqual({
      daysPassed: 31,
      daysLeft: 0,
      totalDays: 31,
      isOpen: false,
    });
  });
});
