import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecurringObligation, RecurringObligationCandidate } from '@/types/planning';
import { usePlanningStore } from './usePlanningStore';

const api = vi.hoisted(() => ({
  listRecurringObligations: vi.fn(),
  decideRecurringObligation: vi.fn(),
}));

vi.mock('@/services/backendApi', () => ({ backendApi: api }));

const candidate: RecurringObligationCandidate = {
  id: 'recurring_a1b2c3d4',
  label: 'House rent',
  category: 'rent',
  type: 'expense',
  amount: 20_000,
  cadence: 'monthly',
  nextDueDate: '2026-09-01',
  sourceTransactionIds: ['txn-1', 'txn-2'],
  confidence: 'estimated',
};

const obligation = (id: string, nextDueDate: string): RecurringObligation => ({
  ...candidate,
  id,
  nextDueDate,
  userId: 'user-1',
  status: 'confirmed',
  revision: 1,
  createdAt: '2026-08-24T00:00:00Z',
  updatedAt: '2026-08-24T00:00:00Z',
});

describe('usePlanningStore', () => {
  beforeEach(() => {
    api.listRecurringObligations.mockReset();
    api.decideRecurringObligation.mockReset();
    usePlanningStore.setState({
      ownerUserId: null,
      recurringObligations: [],
      status: 'idle',
      error: null,
      decisionPendingId: null,
    });
  });

  it('loads bounded cursor pages and orders obligations deterministically', async () => {
    api.listRecurringObligations
      .mockResolvedValueOnce({ items: [obligation('recurring_bbbbbbbb', '2026-09-20')], page: { nextCursor: 'next' } })
      .mockResolvedValueOnce({ items: [obligation('recurring_aaaaaaaa', '2026-09-01')], page: { nextCursor: null } });

    await usePlanningStore.getState().loadRecurringObligations('user-1');

    expect(api.listRecurringObligations).toHaveBeenCalledTimes(2);
    expect(usePlanningStore.getState()).toMatchObject({ ownerUserId: 'user-1', status: 'ready', error: null });
    expect(usePlanningStore.getState().recurringObligations.map(({ id }) => id)).toEqual([
      'recurring_aaaaaaaa',
      'recurring_bbbbbbbb',
    ]);
  });

  it('reuses the same idempotency key when a decision is retried', async () => {
    usePlanningStore.setState({ ownerUserId: 'user-1', status: 'ready' });
    api.decideRecurringObligation
      .mockRejectedValueOnce(new Error('temporary outage'))
      .mockResolvedValueOnce({ item: obligation(candidate.id, candidate.nextDueDate), receipt: {} });

    await usePlanningStore.getState().decideRecurringObligation('user-1', candidate, 'confirm');
    await usePlanningStore.getState().decideRecurringObligation('user-1', candidate, 'confirm');

    expect(api.decideRecurringObligation.mock.calls[0][3]).toBe(api.decideRecurringObligation.mock.calls[1][3]);
    expect(usePlanningStore.getState()).toMatchObject({ status: 'ready', error: null, decisionPendingId: null });
    expect(usePlanningStore.getState().recurringObligations).toHaveLength(1);
  });

  it('clears user-scoped facts when the authenticated owner leaves', () => {
    usePlanningStore.setState({ ownerUserId: 'user-1', recurringObligations: [obligation(candidate.id, candidate.nextDueDate)], status: 'ready' });

    usePlanningStore.getState().clearForUser();

    expect(usePlanningStore.getState()).toMatchObject({ ownerUserId: null, recurringObligations: [], status: 'idle' });
  });
});
