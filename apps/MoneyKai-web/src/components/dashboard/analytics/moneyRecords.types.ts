import type { Transaction, TransactionType } from '@/types/transaction';

export type MoneyRecordsSortKey = 'date' | 'amount' | 'description';
export type MoneyRecordsTypeFilter = 'all' | TransactionType;

export interface MoneyRecordsBreakdownItem {
  id: string;
  label: string;
  count: number;
  total: number;
  percentage: number;
}

export interface MoneyRecordsSummary {
  count: number;
  income: number;
  expense: number;
  net: number;
  largestExpense: Transaction | null;
  dateRange: { start: string; end: string } | null;
  categories: MoneyRecordsBreakdownItem[];
  sources: MoneyRecordsBreakdownItem[];
  transactionTypes: TransactionType[];
  hasMixedTypes: boolean;
}
