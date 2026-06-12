export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  payment_method: string;
  captureAccountId?: string;
  captureAccountLabel?: string;
  captureBankLabel?: string;
  captureAccountHint?: string;
  canonicalTransactionKey?: string;
  sourceFingerprint?: string;
  receipt_url?: string;
  transaction_date: string;
  created_at: string;
}

export interface TransactionFilter {
  type?: TransactionType;
  category?: string;
  dateRange: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  paymentMethod?: string;
  captureAccountId?: string;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: string;
  category: string;
  description: string;
  payment_method: string;
  transaction_date: Date;
  receipt_uri?: string;
}

export interface CategoryTotal {
  category: string;
  total: number;
  percentage: number;
  count: number;
}
