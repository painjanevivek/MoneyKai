export type TransactionType = 'income' | 'expense';
export type TransactionCaptureSource = 'notification' | 'sms' | 'aa' | 'gmail' | 'pdf' | 'portfolio' | 'manual';

export interface ContactAllocation {
  /** Device contact IDs are only used to re-identify a selection on this device. */
  contactId: string;
  name: string;
  amount: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  amountMinor?: number;
  currency?: 'INR';
  parserVersion?: string;
  importIdentity?: string;
  accountIdentity?: string;
  semantics?: 'payment' | 'refund' | 'reversal' | 'transfer';
  reviewStatus?: 'approved' | 'pending' | 'dismissed';
  syncStatus?: 'local_only' | 'pending' | 'synced' | 'conflict' | 'pending_delete';
  revision?: number;
  category: string;
  description: string;
  counterpartyName?: string;
  counterpartyKind?: 'merchant' | 'person' | 'unknown';
  automaticallyRecorded?: boolean;
  payment_method: string;
  contact_allocations?: ContactAllocation[];
  contact_split_mode?: 'equal' | 'custom';
  captureAccountId?: string;
  captureAccountLabel?: string;
  captureBankLabel?: string;
  captureAccountHint?: string;
  captureSource?: TransactionCaptureSource;
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
