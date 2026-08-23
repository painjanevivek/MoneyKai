import { create } from 'zustand';
import { backendApi } from '@/services/backendApi';
import type { RecurringObligation, RecurringObligationCandidate } from '@/types/planning';

export type PlanningLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PlanningState {
  ownerUserId: string | null;
  recurringObligations: RecurringObligation[];
  status: PlanningLoadStatus;
  error: string | null;
  decisionPendingId: string | null;
  clearForUser: (userId?: string) => void;
  loadRecurringObligations: (userId: string, force?: boolean) => Promise<void>;
  decideRecurringObligation: (userId: string, candidate: RecurringObligationCandidate, action: 'confirm' | 'dismiss') => Promise<void>;
}

const decisionKeys = new Map<string, string>();
const createDecisionKey = () => typeof globalThis.crypto?.randomUUID === 'function'
  ? globalThis.crypto.randomUUID()
  : `planning_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

export const usePlanningStore = create<PlanningState>((set, get) => ({
  ownerUserId: null,
  recurringObligations: [],
  status: 'idle',
  error: null,
  decisionPendingId: null,

  clearForUser: (userId) => {
    const ownerId = userId ?? get().ownerUserId;
    if (ownerId) {
      for (const key of decisionKeys.keys()) {
        if (key.startsWith(`${ownerId}:`)) decisionKeys.delete(key);
      }
    }
    set({ ownerUserId: null, recurringObligations: [], status: 'idle', error: null, decisionPendingId: null });
  },

  loadRecurringObligations: async (userId, force = false) => {
    const current = get();
    if (!force && current.ownerUserId === userId && (current.status === 'loading' || current.status === 'ready')) return;
    set({
      ownerUserId: userId,
      recurringObligations: current.ownerUserId === userId ? current.recurringObligations : [],
      status: 'loading',
      error: null,
      decisionPendingId: current.ownerUserId === userId ? current.decisionPendingId : null,
    });
    try {
      let cursor: string | null = null;
      let pages = 0;
      const items: RecurringObligation[] = [];
      do {
        if (pages >= 5) throw new Error('Recurring-obligation history exceeded the safety page limit.');
        const response = await backendApi.listRecurringObligations(undefined, 100, cursor);
        items.push(...response.items);
        cursor = response.page.nextCursor;
        pages += 1;
      } while (cursor);
      if (get().ownerUserId === userId) set({ recurringObligations: mergeById([], items), status: 'ready', error: null });
    } catch (caught) {
      if (get().ownerUserId === userId) set({ status: 'error', error: caught instanceof Error ? caught.message : 'Planning facts could not be loaded.' });
    }
  },

  decideRecurringObligation: async (userId, candidate, action) => {
    const current = get();
    const existing = current.recurringObligations.find((item) => item.id === candidate.id);
    const candidateFingerprint = JSON.stringify(candidate);
    const keyId = `${userId}:${candidate.id}:${action}:${existing?.revision ?? 0}:${candidateFingerprint}`;
    const idempotencyKey = decisionKeys.get(keyId) ?? createDecisionKey();
    decisionKeys.set(keyId, idempotencyKey);
    set({ decisionPendingId: candidate.id, error: null });
    try {
      const response = await backendApi.decideRecurringObligation(candidate, action, existing?.revision ?? 0, idempotencyKey);
      decisionKeys.delete(keyId);
      if (get().ownerUserId === userId) {
        set((state) => ({ recurringObligations: mergeById(state.recurringObligations, [response.item]), status: 'ready', decisionPendingId: null }));
      }
    } catch (caught) {
      if (get().ownerUserId === userId) set({ decisionPendingId: null, error: caught instanceof Error ? caught.message : 'The planning decision could not be confirmed.' });
    }
  },
}));

function mergeById(current: RecurringObligation[], incoming: RecurringObligation[]) {
  const values = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => values.set(item.id, item));
  return [...values.values()].sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate) || left.id.localeCompare(right.id));
}
