import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { buildCategoryTotals, filterTransactionsByMonth, getMonthLabel } from '@/utils/dashboard';
import type { CategoryTotal, Transaction } from '@/types/transaction';

export const getMonthTransactionsNewestFirst = (transactions: Transaction[], monthKey: string): Transaction[] =>
  [...filterTransactionsByMonth(transactions, monthKey)].sort(
    (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  );

export const getMonthExpenses = (transactions: Transaction[], monthKey: string) =>
  filterTransactionsByMonth(transactions, monthKey)
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

export const getMonthIncome = (transactions: Transaction[], monthKey: string) =>
  filterTransactionsByMonth(transactions, monthKey)
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

export const getMonthNet = (transactions: Transaction[], monthKey: string) =>
  getMonthIncome(transactions, monthKey) - getMonthExpenses(transactions, monthKey);

export const getMonthCategoryTotals = (transactions: Transaction[], monthKey: string): CategoryTotal[] =>
  buildCategoryTotals(getMonthTransactionsNewestFirst(transactions, monthKey));

export const getMonthSummary = (transactions: Transaction[], monthKey: string) => {
  const monthTransactions = getMonthTransactionsNewestFirst(transactions, monthKey);
  const totals = monthTransactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'expense') {
        acc.expenses += transaction.amount;
      } else {
        acc.income += transaction.amount;
      }
      return acc;
    },
    { expenses: 0, income: 0 }
  );

  return {
    monthKey,
    monthLabel: getMonthLabel(monthKey),
    transactions: monthTransactions,
    expenses: totals.expenses,
    income: totals.income,
    net: totals.income - totals.expenses,
    categoryTotals: buildCategoryTotals(monthTransactions),
  };
};

export const formatMonthKey = (date: Date) => format(date, 'yyyy-MM');

export const parseMonthKey = (monthKey: string) => parseISO(`${monthKey}-01`);
