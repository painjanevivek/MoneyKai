import { format } from 'date-fns/format';
import type { Transaction } from '@/types/transaction';

export type TransactionHistorySortOption =
  | 'newest'
  | 'oldest'
  | 'amount_high'
  | 'amount_low'
  | 'name_az'
  | 'name_za';

export type TransactionMonthSection = {
  key: string;
  title: string;
  data: Transaction[];
  totalSpendingPaise: number;
};

/** Credit/refund entries are not spending. Sum minor units to avoid decimal drift. */
const transactionSpendingPaise = (transaction: Transaction): number =>
  transaction.type === 'expense' && Number.isFinite(transaction.amount) && transaction.amount > 0
    ? Math.round(transaction.amount * 100)
    : 0;

export const parseTransactionDate = (value: string) => new Date(`${value}T12:00:00`);

const getTransactionTime = (transaction: Transaction) => new Date(transaction.transaction_date).getTime();
const getCreatedTime = (transaction: Transaction) => new Date(transaction.created_at).getTime();

export const compareTransactionsNewestFirst = (a: Transaction, b: Transaction) =>
  getTransactionTime(b) - getTransactionTime(a) ||
  getCreatedTime(b) - getCreatedTime(a) ||
  b.id.localeCompare(a.id);

export const compareTransactionsOldestFirst = (a: Transaction, b: Transaction) =>
  getTransactionTime(a) - getTransactionTime(b) ||
  getCreatedTime(a) - getCreatedTime(b) ||
  a.id.localeCompare(b.id);

export const sortTransactionsForHistory = (
  transactions: Transaction[],
  sortOption: TransactionHistorySortOption,
  displayName: (transaction: Transaction) => string = transaction => transaction.description,
): Transaction[] => {
  const nextTransactions = [...transactions];

  switch (sortOption) {
    case 'oldest':
      return nextTransactions.sort(compareTransactionsOldestFirst);
    case 'amount_high':
      return nextTransactions.sort((a, b) => b.amount - a.amount || compareTransactionsNewestFirst(a, b));
    case 'amount_low':
      return nextTransactions.sort((a, b) => a.amount - b.amount || compareTransactionsNewestFirst(a, b));
    case 'name_az':
      return nextTransactions.sort((a, b) => displayName(a).localeCompare(displayName(b)) || compareTransactionsNewestFirst(a, b));
    case 'name_za':
      return nextTransactions.sort((a, b) => displayName(b).localeCompare(displayName(a)) || compareTransactionsNewestFirst(a, b));
    case 'newest':
    default:
      return nextTransactions.sort(compareTransactionsNewestFirst);
  }
};

export const groupTransactionsByMonth = (transactions: Transaction[]): TransactionMonthSection[] => {
  const sections = new Map<string, TransactionMonthSection>();

  transactions.forEach((transaction) => {
    const transactionDate = parseTransactionDate(transaction.transaction_date);
    const sectionKey = format(transactionDate, 'yyyy-MM');
    const sectionTitle = format(transactionDate, 'MMMM yyyy');
    const existingSection = sections.get(sectionKey);

    if (existingSection) {
      existingSection.data.push(transaction);
      existingSection.totalSpendingPaise += transactionSpendingPaise(transaction);
      return;
    }

    sections.set(sectionKey, {
      key: sectionKey,
      title: sectionTitle,
      data: [transaction],
      totalSpendingPaise: transactionSpendingPaise(transaction),
    });
  });

  return Array.from(sections.values()).sort((a, b) => b.key.localeCompare(a.key));
};

/** Match the list's grouping to its advertised order, including across months. */
export const buildTransactionHistorySections = (
  transactions: Transaction[],
  sortOption: TransactionHistorySortOption,
  displayName?: (transaction: Transaction) => string,
): TransactionMonthSection[] => {
  const ordered = sortTransactionsForHistory(transactions, sortOption, displayName);
  if (!ordered.length) return [];
  if (sortOption !== 'newest' && sortOption !== 'oldest') {
    return [{ key: 'ordered-records', title: 'Matching transactions', data: ordered,
      totalSpendingPaise: ordered.reduce((total, transaction) => total + transactionSpendingPaise(transaction), 0) }];
  }
  const sections = groupTransactionsByMonth(ordered);
  return sortOption === 'oldest' ? sections.reverse() : sections;
};
