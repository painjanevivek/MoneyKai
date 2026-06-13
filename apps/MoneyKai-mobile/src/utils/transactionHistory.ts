import { format } from 'date-fns';
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
};

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
  sortOption: TransactionHistorySortOption
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
      return nextTransactions.sort((a, b) => a.description.localeCompare(b.description) || compareTransactionsNewestFirst(a, b));
    case 'name_za':
      return nextTransactions.sort((a, b) => b.description.localeCompare(a.description) || compareTransactionsNewestFirst(a, b));
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
      return;
    }

    sections.set(sectionKey, {
      key: sectionKey,
      title: sectionTitle,
      data: [transaction],
    });
  });

  return Array.from(sections.values()).sort((a, b) => b.key.localeCompare(a.key));
};
