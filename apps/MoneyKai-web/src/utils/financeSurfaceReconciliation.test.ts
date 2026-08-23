import { describe, expect, it, vi } from 'vitest';
import type { Transaction } from '@/types/transaction';
import { buildCashflowPlan } from './cashflowPlan';
import { financePeriodProgress, monthFinancePeriod, summarizeTransactions } from './financeCore';
import { calculateSavingsProjection } from './savingsEngine';

vi.mock('./formatCurrency', () => ({ formatCurrency: (value: number) => String(value) }));

const transaction = (id: string, type: 'income' | 'expense', amount: number, date: string, category: string): Transaction => ({
  id,
  user_id: 'golden-user',
  type,
  amount,
  transaction_date: date,
  category,
  description: id,
  payment_method: 'cash',
  created_at: `${date}T00:00:00Z`,
});

describe('golden finance surface reconciliation', () => {
  it('gives dashboard, budget, savings, and report selectors the same reviewed monthly facts', () => {
    const transactions = [
      transaction('salary', 'income', 50_000, '2026-08-01', 'income'),
      transaction('rent', 'expense', 20_000, '2026-08-01', 'rent'),
      transaction('food', 'expense', 2_000, '2026-08-12', 'food'),
      transaction('outside', 'expense', 999, '2026-09-01', 'other'),
    ];
    const selectedMonth = new Date(2026, 7, 15, 12);
    const period = monthFinancePeriod(selectedMonth);
    const reportFacts = summarizeTransactions(transactions, { period });
    const plan = buildCashflowPlan({
      transactions,
      monthlyAllowance: 60_000,
      challenges: [],
      cycleStart: new Date('2026-08-01T00:00:00Z'),
      cycleEnd: new Date('2026-09-01T00:00:00Z'),
      now: new Date('2026-08-24T12:00:00Z'),
    });
    const savings = calculateSavingsProjection(
      60_000,
      reportFacts.categories,
      [],
      0,
      financePeriodProgress(period, new Date(2026, 7, 24, 12)),
    );

    expect(reportFacts).toMatchObject({ income: 50_000, expense: 22_000, net: 28_000, count: 3 });
    expect(plan.metrics).toMatchObject({ actualIncome: reportFacts.income, actualExpense: reportFacts.expense, budgetAvailable: 38_000 });
    expect(plan.categories).toEqual(reportFacts.categories);
    expect(savings.newDailyLimit).toBe(Math.round((60_000 - reportFacts.expense) / 7));
  });
});
