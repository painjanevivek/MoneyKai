import React from 'react';
import { usePlanningStore } from '@/stores/usePlanningStore';

export function useRecurringPlanning(userId?: string) {
  const recurringObligations = usePlanningStore((state) => state.recurringObligations);
  const status = usePlanningStore((state) => state.status);
  const error = usePlanningStore((state) => state.error);
  const decisionPendingId = usePlanningStore((state) => state.decisionPendingId);
  const load = usePlanningStore((state) => state.loadRecurringObligations);
  const decide = usePlanningStore((state) => state.decideRecurringObligation);
  const clear = usePlanningStore((state) => state.clearForUser);

  React.useEffect(() => {
    if (!userId) {
      clear();
      return;
    }
    const task = setTimeout(() => void load(userId), 0);
    return () => clearTimeout(task);
  }, [clear, load, userId]);

  return {
    recurringObligations,
    status,
    error,
    decisionPendingId,
    retry: () => userId ? load(userId, true) : Promise.resolve(),
    decide: (candidate: Parameters<typeof decide>[1], action: Parameters<typeof decide>[2]) =>
      userId ? decide(userId, candidate, action) : Promise.resolve(),
  };
}
