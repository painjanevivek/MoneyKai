import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackendSnapshot } from '@/types/backend';
import { hydrateRemainingWorkspace, synchronizeFromToken } from './workspaceHydration';

const mocks = vi.hoisted(() => {
  const createStore = (initial: Record<string, unknown>) => {
    const state = { ...initial };
    return {
      state,
      getState: () => state,
      setState: (update: Record<string, unknown> | ((current: typeof state) => Record<string, unknown>)) => {
        Object.assign(state, typeof update === 'function' ? update(state) : update);
      },
      persist: { hasHydrated: () => true },
    };
  };
  return {
    backendApi: {
      getBootstrapPage: vi.fn(),
      getIncrementalSync: vi.fn(),
    },
    settings: createStore({}),
    budget: createStore({}),
    transactions: createStore({ transactions: [{ id: 'tx-new', amount: 10 }] }),
    notes: createStore({ notes: [] }),
    groups: createStore({ groups: [], expenses: [] }),
    challenges: createStore({ challenges: [], totalXP: 0 }),
    badges: createStore({ badges: [] }),
    notifications: createStore({
      notifications: [],
      replaceNotifications(items: unknown[]) {
        this.notifications = items;
      },
    }),
    linkedAccounts: createStore({ accounts: [] }),
    planning: createStore({ ownerUserId: 'user-1', recurringObligations: [] }),
  };
});

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
}));
vi.mock('./backendApi', () => ({ backendApi: mocks.backendApi }));
vi.mock('@/stores/useSettingsStore', () => ({ useSettingsStore: mocks.settings }));
vi.mock('@/stores/useBudgetStore', () => ({ useBudgetStore: mocks.budget }));
vi.mock('@/stores/useTransactionStore', () => ({ useTransactionStore: mocks.transactions }));
vi.mock('@/stores/useNotesStore', () => ({ useNotesStore: mocks.notes }));
vi.mock('@/stores/useGroupStore', () => ({ useGroupStore: mocks.groups }));
vi.mock('@/stores/useChallengeStore', () => ({ useChallengeStore: mocks.challenges }));
vi.mock('@/stores/useBadgeStore', () => ({ useBadgeStore: mocks.badges }));
vi.mock('@/stores/useNotificationStore', () => ({ useNotificationStore: mocks.notifications }));
vi.mock('@/stores/useLinkedAccountStore', () => ({ useLinkedAccountStore: mocks.linkedAccounts }));
vi.mock('@/stores/usePlanningStore', () => ({ usePlanningStore: mocks.planning }));

describe('progressive workspace hydration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transactions.state.transactions = [{ id: 'tx-new', amount: 10 }];
    mocks.planning.state.ownerUserId = 'user-1';
    mocks.planning.state.recurringObligations = [];
  });

  it('renders the bounded page first, appends continuation pages, then advances sync', async () => {
    mocks.backendApi.getBootstrapPage.mockResolvedValue({
      items: [{ id: 'tx-old', amount: 20 }],
      page: { nextCursor: null, hasMore: false, limit: 30, documentReads: 2 },
    });
    mocks.backendApi.getIncrementalSync.mockResolvedValue({
      events: [],
      page: { nextCursor: null, hasMore: false, limit: 100, documentReads: 0 },
      resetRequired: false,
      reason: null,
      windowEnd: '2026-08-24T00:01:00Z',
      nextSyncToken: 'sync-next',
    });
    const snapshot = {
      version: 1,
      capturedAt: '2026-08-24T00:00:00Z',
      profile: { id: 'user-1', email: '', full_name: '' },
      settings: { app: {}, budget: {} },
      data: {
        transactions: [{ id: 'tx-new', amount: 10 }],
        notes: [],
        groups: [],
        groupExpenses: [],
        challenges: [],
        totalXP: 0,
        badges: [],
        notifications: [],
      },
      pages: {
        transactions: { nextCursor: 'cursor-1', hasMore: true, limit: 30, documentReads: 31 },
      },
      syncToken: 'sync-initial',
    } as unknown as BackendSnapshot;

    const nextToken = await hydrateRemainingWorkspace(snapshot, () => true);

    expect(nextToken).toBe('sync-next');
    expect(mocks.backendApi.getBootstrapPage).toHaveBeenCalledWith(
      'transactions',
      snapshot.capturedAt,
      'cursor-1',
    );
    expect(mocks.transactions.state.transactions).toEqual([
      { id: 'tx-new', amount: 10 },
      { id: 'tx-old', amount: 20 },
    ]);
    expect(mocks.backendApi.getIncrementalSync).toHaveBeenCalledWith('sync-initial', null, null);
  });

  it('applies user-scoped recurring-obligation sync events to an active planning store', async () => {
    mocks.backendApi.getIncrementalSync.mockResolvedValue({
      events: [{
        id: 'event-1',
        resource: 'recurringObligations',
        action: 'upserted',
        itemId: 'recurring_a1b2c3d4',
        occurredAt: '2026-08-24T00:00:00Z',
        payload: {
          id: 'recurring_a1b2c3d4',
          userId: 'user-1',
          label: 'House rent',
          category: 'rent',
          type: 'expense',
          amount: 20_000,
          cadence: 'monthly',
          nextDueDate: '2026-09-01',
          sourceTransactionIds: ['txn-1', 'txn-2'],
          confidence: 'estimated',
          status: 'confirmed',
          revision: 1,
          createdAt: '2026-08-24T00:00:00Z',
          updatedAt: '2026-08-24T00:00:00Z',
        },
      }],
      page: { nextCursor: null, hasMore: false, limit: 100, documentReads: 1 },
      resetRequired: false,
      reason: null,
      windowEnd: '2026-08-24T00:01:00Z',
      nextSyncToken: 'sync-next',
    });

    await synchronizeFromToken('sync-initial', () => true);

    expect(mocks.planning.state.recurringObligations).toHaveLength(1);
    expect((mocks.planning.state.recurringObligations as { id: string }[])[0].id).toBe('recurring_a1b2c3d4');
  });
});
