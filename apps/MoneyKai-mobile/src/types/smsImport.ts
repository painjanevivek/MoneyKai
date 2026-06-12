export type SmsImportRangeId = '15_days' | '1_month' | '3_months' | '6_months' | '1_year' | 'all';

export interface SmsImportRangeOption {
  id: SmsImportRangeId;
  label: string;
  days?: number;
  maxMessages: number;
  pageSize: number;
}

export interface SmsImportProgress {
  phase: 'discovering_accounts' | 'importing_transactions' | 'complete';
  scannedCount: number;
  eligibleCount: number;
  draftedCount: number;
  duplicateCount: number;
  parserIgnoredCount: number;
  pageCount: number;
  message?: string;
}
