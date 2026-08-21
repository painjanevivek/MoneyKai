import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/types/transaction';
import { filterAndSortMoneyRecords, getSelectedMoneyRecords, summarizeMoneyRecords } from './moneyRecordsSelectors';

const transaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'transaction-1',
  user_id: 'user-1',
  type: 'expense',
  amount: 100,
  category: 'food',
  description: 'Lunch',
  payment_method: 'upi',
  transaction_date: '2026-08-10',
  created_at: '2026-08-10T12:00:00.000Z',
  captureSource: 'manual',
  ...overrides,
});

const records = [
  transaction({ id: 'expense-1', amount: 250, category: 'food', description: 'Dinner', transaction_date: '2026-08-12' }),
  transaction({ id: 'expense-2', amount: 100, category: 'transport', description: 'Metro', transaction_date: '2026-08-11', captureSource: 'sms' }),
  transaction({ id: 'income-1', type: 'income', amount: 1000, category: 'freelance', description: 'Client', transaction_date: '2026-08-13' }),
];

describe('money records selectors', () => {
  it('summarizes the current period without mixing income and expense totals', () => {
    const summary = summarizeMoneyRecords(records);
    expect(summary).toMatchObject({ count: 3, income: 1000, expense: 350, net: 650, hasMixedTypes: true });
    expect(summary.largestExpense?.id).toBe('expense-1');
    expect(summary.dateRange).toEqual({ start: '2026-08-11', end: '2026-08-13' });
  });

  it('builds deterministic category and source breakdowns', () => {
    const summary = summarizeMoneyRecords(records);
    expect(summary.categories.map((item) => item.id)).toEqual(['freelance', 'food', 'transport']);
    expect(summary.sources.map((item) => item.id)).toEqual(['manual', 'sms']);
    expect(summary.sources[0].count).toBe(2);
  });

  it('filters and sorts without mutating the source collection', () => {
    const result = filterAndSortMoneyRecords(records, 'expense', 'amount', true);
    expect(result.map((item) => item.id)).toEqual(['expense-1', 'expense-2']);
    expect(records.map((item) => item.id)).toEqual(['expense-1', 'expense-2', 'income-1']);
  });

  it('returns only records represented by selected identifiers', () => {
    expect(getSelectedMoneyRecords(records, new Set(['expense-2', 'missing'])).map((item) => item.id)).toEqual(['expense-2']);
  });

  it('returns a stable empty summary', () => {
    expect(summarizeMoneyRecords([])).toMatchObject({ count: 0, income: 0, expense: 0, net: 0, largestExpense: null, dateRange: null, hasMixedTypes: false });
  });
});
