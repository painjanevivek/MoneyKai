export type RecurringObligationStatus = 'confirmed' | 'dismissed';

export interface RecurringObligationCandidate {
  id: string;
  label: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  cadence: 'monthly';
  nextDueDate: string;
  sourceTransactionIds: string[];
  confidence: 'estimated';
}

export interface RecurringObligation extends Omit<RecurringObligationCandidate, 'id'> {
  id: string;
  userId: string;
  status: RecurringObligationStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringObligationDecisionResponse {
  item: RecurringObligation;
  receipt: {
    mutationId: string;
    status: 'pending' | 'confirmed' | 'conflicted' | 'rejected' | 'retryable' | 'failed';
    idempotencyKey: string;
    correlationId: string;
    replayed: boolean;
  };
}
