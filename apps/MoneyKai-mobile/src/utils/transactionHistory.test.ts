import { describe, expect, it } from 'vitest';
import { groupTransactionsByMonth, sortTransactionsForHistory } from '@/utils/transactionHistory';
import type { Transaction } from '@/types/transaction';

const buildTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'txn',
  user_id: 'local',
  type: 'expense',
  amount: 100,
  category: 'food',
  description: 'Test',
  payment_method: 'upi',
  transaction_date: '2026-06-01',
  created_at: '2026-06-01T10:00:00.000Z',
  ...overrides,
});

describe('transaction history utilities', () => {
  it('orders transactions latest to oldest with stable tie breakers', () => {
    const transactions = [
      buildTransaction({ id: 'old', transaction_date: '2026-05-31', created_at: '2026-06-01T10:00:00.000Z' }),
      buildTransaction({ id: 'newer-created', transaction_date: '2026-06-10', created_at: '2026-06-10T11:00:00.000Z' }),
      buildTransaction({ id: 'older-created', transaction_date: '2026-06-10', created_at: '2026-06-10T10:00:00.000Z' }),
    ];

    expect(sortTransactionsForHistory(transactions, 'newest').map((transaction) => transaction.id)).toEqual([
      'newer-created',
      'older-created',
      'old',
    ]);
  });

  it('keeps month sections newest first even when rows are amount sorted', () => {
    const amountSorted = sortTransactionsForHistory([
      buildTransaction({ id: 'may-high', amount: 900, transaction_date: '2026-05-20' }),
      buildTransaction({ id: 'june-low', amount: 100, transaction_date: '2026-06-02' }),
      buildTransaction({ id: 'april-mid', amount: 500, transaction_date: '2026-04-15' }),
    ], 'amount_high');

    const sections = groupTransactionsByMonth(amountSorted);

    expect(sections.map((section) => section.title)).toEqual(['June 2026', 'May 2026', 'April 2026']);
    expect(sections.find((section) => section.key === '2026-05')?.data.map((transaction) => transaction.id)).toEqual(['may-high']);
  });
});
