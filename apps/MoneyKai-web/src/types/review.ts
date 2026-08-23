export type ReviewAction = 'approve' | 'edit' | 'ignore' | 'defer';
export type ReviewItemStatus = 'pending' | 'deferred' | 'approved' | 'ignored' | 'duplicate' | 'conflict';
export type ReviewPriority = 'critical' | 'high' | 'medium' | 'low';
export type ReviewSource = 'sms' | 'gmail' | 'pdf' | 'portfolio' | 'manual' | 'account_aggregator';

export interface ReviewEvidence {
  code: string;
  label: string;
  value: string;
}

export interface ReviewSubject {
  id?: string | null;
  source: ReviewSource;
  sourceRecordId?: string | null;
  sourceDocumentId?: string | null;
  eventType: 'transaction' | 'holding' | 'trade';
  amount?: number | null;
  currency: 'INR';
  date: string;
  description: string;
  counterparty?: string | null;
  accountId?: string | null;
  providerKey?: string | null;
  direction: 'debit' | 'credit' | 'neutral';
  confidence: number;
  sourceFingerprint?: string | null;
}

export interface ReviewItem {
  id: string;
  kind: 'transaction_reconciliation';
  reasonCode: string;
  priority: ReviewPriority;
  title: string;
  summary: string;
  status: ReviewItemStatus;
  confidence: number;
  provenance: {
    source: ReviewSource;
    sourceRecordId?: string | null;
    sourceDocumentId?: string | null;
    capturedAt: string;
  };
  evidence: ReviewEvidence[];
  allowedActions: ReviewAction[];
  subject: ReviewSubject;
  matchedTransactionId?: string | null;
  revision: number;
  deferredUntil?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ReviewFilters {
  status?: ReviewItemStatus;
  source?: ReviewSource;
}

export interface ReviewActionRequest {
  action: ReviewAction;
  expectedRevision: number;
  deferredUntil?: string;
  edits?: Partial<Pick<ReviewSubject, 'amount' | 'date' | 'description' | 'counterparty' | 'direction'>>;
}

export interface ReviewActionResponse {
  item: ReviewItem;
  canonicalTransaction?: import('./transaction').Transaction | null;
  receipt: {
    mutationId: string;
    status: 'pending' | 'confirmed' | 'conflicted' | 'rejected' | 'retryable' | 'failed';
    idempotencyKey: string;
    correlationId: string;
    resourceVersion?: string | null;
    reasonCode?: string | null;
    replayed: boolean;
  };
}
