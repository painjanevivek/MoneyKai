import type { Transaction } from './transaction';

export type FinancialEventSource = 'sms' | 'gmail' | 'pdf' | 'portfolio' | 'manual' | 'account_aggregator';
export type FinancialEventType = 'transaction' | 'holding' | 'trade';
export type FinancialEventDirection = 'debit' | 'credit' | 'neutral';
export type ReconciliationStatus = 'new_transaction' | 'enrich_existing' | 'duplicate' | 'conflict';
export type ReconciliationReviewStatus = 'pending' | 'approved' | 'ignored' | 'duplicate' | 'conflict';

export interface NormalizedFinancialEvent {
  id?: string | null;
  source: FinancialEventSource;
  sourceRecordId?: string | null;
  sourceDocumentId?: string | null;
  eventType: FinancialEventType;
  amount?: number | null;
  currency: 'INR';
  date: string;
  description: string;
  counterparty?: string | null;
  accountId?: string | null;
  providerKey?: string | null;
  direction: FinancialEventDirection;
  confidence: number;
  sourceFingerprint?: string | null;
}

export interface ReconciliationCandidate {
  id: string;
  userId: string;
  event: NormalizedFinancialEvent;
  canonicalKey: string;
  status: ReconciliationStatus;
  reviewStatus: ReconciliationReviewStatus;
  matchedTransactionId?: string | null;
  confidence: number;
  reasons: string[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface ReconciliationRunRequest {
  events: NormalizedFinancialEvent[];
}

export interface ParsedDocumentReconciliationRequest {
  documentId: string;
}

export interface ReconciliationRunResponse {
  items: ReconciliationCandidate[];
  newCount: number;
  duplicateCount: number;
  enrichCount: number;
  conflictCount: number;
}

export interface ReconciliationApprovalResponse {
  item: ReconciliationCandidate;
  createdTransaction?: Transaction | null;
}
