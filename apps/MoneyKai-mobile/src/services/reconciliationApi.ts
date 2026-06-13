import { isPdfStatementParsingEnabled, isWealthTabEnabled } from '@/config/environment';
import { backendApi } from './backendApi';
import type {
  NormalizedFinancialEvent,
  ReconciliationApprovalResponse,
  ReconciliationCandidate,
  ReconciliationRunResponse,
  ReconciliationReviewStatus,
} from '@/types/reconciliation';

const ensureReconciliationEnabled = () => {
  if (!isPdfStatementParsingEnabled() && !isWealthTabEnabled()) {
    throw new Error('Financial reconciliation is disabled for this build.');
  }
};

export const reconciliationApi = {
  listReviews: async (status: ReconciliationReviewStatus | 'all' = 'pending'): Promise<ReconciliationCandidate[]> => {
    ensureReconciliationEnabled();
    const response = await backendApi.listReconciliationReviews(status === 'all' ? undefined : status);
    return response.items;
  },

  run: async (events: NormalizedFinancialEvent[]): Promise<ReconciliationRunResponse> => {
    ensureReconciliationEnabled();
    return backendApi.runReconciliation({ events });
  },

  reconcileParsedDocument: async (documentId: string): Promise<ReconciliationRunResponse> => {
    ensureReconciliationEnabled();
    return backendApi.reconcileParsedDocument({ documentId });
  },

  approveReview: async (reviewId: string): Promise<ReconciliationApprovalResponse> => {
    ensureReconciliationEnabled();
    return backendApi.approveReconciliationReview(reviewId);
  },

  ignoreReview: async (reviewId: string): Promise<ReconciliationCandidate> => {
    ensureReconciliationEnabled();
    const response = await backendApi.ignoreReconciliationReview(reviewId);
    return response.item;
  },
};
