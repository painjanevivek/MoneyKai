import type { Transaction } from '@/types/transaction';
import type {
  MoneyRecordsBreakdownItem,
  MoneyRecordsSortKey,
  MoneyRecordsSummary,
  MoneyRecordsTypeFilter,
} from './moneyRecords.types';

const labelFromId = (value: string) =>
  value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const buildBreakdown = (
  transactions: readonly Transaction[],
  getKey: (transaction: Transaction) => string,
): MoneyRecordsBreakdownItem[] => {
  const grouped = new Map<string, { count: number; total: number }>();
  let total = 0;

  transactions.forEach((transaction) => {
    const key = getKey(transaction) || 'unknown';
    const current = grouped.get(key) ?? { count: 0, total: 0 };
    grouped.set(key, { count: current.count + 1, total: current.total + transaction.amount });
    total += transaction.amount;
  });

  return [...grouped.entries()]
    .map(([id, value]) => ({
      id,
      label: labelFromId(id),
      count: value.count,
      total: value.total,
      percentage: total > 0 ? (value.total / total) * 100 : 0,
    }))
    .sort((left, right) => right.total - left.total || left.label.localeCompare(right.label));
};

export const filterAndSortMoneyRecords = (
  transactions: readonly Transaction[],
  filter: MoneyRecordsTypeFilter,
  sortKey: MoneyRecordsSortKey,
  descending: boolean,
) => transactions
  .filter((transaction) => filter === 'all' || transaction.type === filter)
  .sort((left, right) => {
    const direction = descending ? -1 : 1;
    if (sortKey === 'amount') return (left.amount - right.amount) * direction;
    const comparison = sortKey === 'description'
      ? left.description.localeCompare(right.description)
      : left.transaction_date.localeCompare(right.transaction_date);
    return comparison * direction;
  });

export const summarizeMoneyRecords = (transactions: readonly Transaction[]): MoneyRecordsSummary => {
  let income = 0;
  let expense = 0;
  let largestExpense: Transaction | null = null;
  let start = '';
  let end = '';
  const transactionTypes = new Set<Transaction['type']>();

  transactions.forEach((transaction) => {
    transactionTypes.add(transaction.type);
    if (transaction.type === 'income') income += transaction.amount;
    else {
      expense += transaction.amount;
      if (!largestExpense || transaction.amount > largestExpense.amount) largestExpense = transaction;
    }
    if (!start || transaction.transaction_date < start) start = transaction.transaction_date;
    if (!end || transaction.transaction_date > end) end = transaction.transaction_date;
  });

  const types = [...transactionTypes];
  return {
    count: transactions.length,
    income,
    expense,
    net: income - expense,
    largestExpense,
    dateRange: start && end ? { start, end } : null,
    categories: buildBreakdown(transactions, (transaction) => transaction.category),
    sources: buildBreakdown(transactions, (transaction) => transaction.captureSource ?? 'manual'),
    transactionTypes: types,
    hasMixedTypes: types.length > 1,
  };
};

export const getSelectedMoneyRecords = (
  transactions: readonly Transaction[],
  selectedIds: ReadonlySet<string>,
) => transactions.filter((transaction) => selectedIds.has(transaction.id));
