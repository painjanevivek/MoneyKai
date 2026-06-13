import { create } from 'zustand';
import type { ReconciliationCandidate } from '@/types/reconciliation';

interface ReconciliationState {
  reviews: ReconciliationCandidate[];
  lastLoadedAt?: string;
  setReviews: (reviews: ReconciliationCandidate[]) => void;
  upsertReview: (review: ReconciliationCandidate) => void;
  upsertReviews: (reviews: ReconciliationCandidate[]) => void;
  pendingCount: () => number;
}

export const useReconciliationStore = create<ReconciliationState>()((set, get) => ({
  reviews: [],

  setReviews: (reviews) => set({ reviews, lastLoadedAt: new Date().toISOString() }),

  upsertReview: (review) =>
    set((state) => ({
      reviews: [review, ...state.reviews.filter((existing) => existing.id !== review.id)],
      lastLoadedAt: new Date().toISOString(),
    })),

  upsertReviews: (reviews) =>
    set((state) => {
      const nextById = new Map(state.reviews.map((review) => [review.id, review]));
      reviews.forEach((review) => nextById.set(review.id, review));
      return {
        reviews: Array.from(nextById.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        lastLoadedAt: new Date().toISOString(),
      };
    }),

  pendingCount: () => get().reviews.filter((review) => review.reviewStatus === 'pending').length,
}));
