import AsyncStorage from '@react-native-async-storage/async-storage';
import { backendApi } from './backendApi';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useBadgeStore } from '@/stores/useBadgeStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useLinkedAccountStore } from '@/stores/useLinkedAccountStore';
import type { BackendSnapshot } from '@/types/backend';
import type { Transaction } from '@/types/transaction';
import type { Note } from '@/types/note';
import type { Group, GroupExpense } from '@/types/group';
import type { Challenge } from '@/types/challenge';
import type { Badge } from '@/types/badge';
import type { AppNotification } from '@/types/notification';
import type { LinkedAccount } from '@moneykai/domain';
import type {
  BootstrapResource,
  IncrementalSyncEvent,
} from '@/types/pagination';

const SYNC_TOKEN_PREFIX = 'moneykai-workspace-sync-token-v1';
const MAX_PROGRESSIVE_PAGES_PER_RESOURCE = 200;
const HYDRATION_CONCURRENCY = 3;

type Identified = { id: string };

const tokenKey = (userId: string) => `${SYNC_TOKEN_PREFIX}:${userId}`;

export const getStoredWorkspaceSyncToken = (userId: string) =>
  AsyncStorage.getItem(tokenKey(userId));

export const storeWorkspaceSyncToken = (userId: string, token: string) =>
  AsyncStorage.setItem(tokenKey(userId), token);

export const clearStoredWorkspaceSyncToken = (userId: string) =>
  AsyncStorage.removeItem(tokenKey(userId));

export const hydrateRemainingWorkspace = async (
  snapshot: BackendSnapshot,
  isCurrentSession: () => boolean,
): Promise<string | null> => {
  if (!snapshot.pages || !snapshot.syncToken) return null;
  const resources = (Object.keys(snapshot.pages) as BootstrapResource[]).filter(
    (resource) => snapshot.pages?.[resource]?.hasMore,
  );
  await runWithConcurrency(resources, HYDRATION_CONCURRENCY, async (resource) => {
    let cursor = snapshot.pages?.[resource]?.nextCursor ?? null;
    let pageCount = 0;
    while (cursor && pageCount < MAX_PROGRESSIVE_PAGES_PER_RESOURCE) {
      const response = await backendApi.getBootstrapPage<Identified>(
        resource,
        snapshot.capturedAt,
        cursor,
      );
      if (!isCurrentSession()) return;
      applyResourceItems(resource, response.items);
      cursor = response.page.nextCursor;
      pageCount += 1;
    }
    if (cursor) {
      throw new Error(`Progressive hydration exceeded the safety page limit for ${resource}.`);
    }
  });
  if (!isCurrentSession()) return null;
  return synchronizeFromToken(snapshot.syncToken, isCurrentSession);
};

export const synchronizeFromToken = async (
  syncToken: string,
  isCurrentSession: () => boolean,
): Promise<string | null> => {
  let cursor: string | null = null;
  let windowEnd: string | null = null;
  let nextSyncToken: string | null = null;
  let pageCount = 0;

  do {
    const response = await backendApi.getIncrementalSync(syncToken, cursor, windowEnd);
    if (response.resetRequired) return null;
    if (!isCurrentSession()) return null;
    response.events.forEach(applyIncrementalEvent);
    cursor = response.page.nextCursor;
    windowEnd = response.windowEnd;
    nextSyncToken = response.nextSyncToken;
    pageCount += 1;
    if (pageCount > MAX_PROGRESSIVE_PAGES_PER_RESOURCE) {
      throw new Error('Incremental synchronization exceeded the safety page limit.');
    }
  } while (cursor);

  return nextSyncToken;
};

const applyResourceItems = (resource: BootstrapResource, items: Identified[]) => {
  switch (resource) {
    case 'transactions':
      useTransactionStore.setState((state) => ({
        ...state,
        transactions: mergeById(state.transactions, items as Transaction[]),
      }));
      break;
    case 'notes':
      useNotesStore.setState((state) => ({ ...state, notes: mergeById(state.notes, items as Note[]) }));
      break;
    case 'groups':
      useGroupStore.setState((state) => ({ ...state, groups: mergeById(state.groups, items as Group[]) }));
      break;
    case 'groupExpenses':
      useGroupStore.setState((state) => ({
        ...state,
        expenses: mergeById(state.expenses, items as GroupExpense[]),
      }));
      break;
    case 'savings': {
      useChallengeStore.setState((state) => {
        const challenges = mergeById(state.challenges, items as Challenge[]);
        return { ...state, challenges, totalXP: calculateTotalXp(challenges) };
      });
      break;
    }
    case 'badges':
      useBadgeStore.setState((state) => ({ ...state, badges: mergeById(state.badges, items as Badge[]) }));
      break;
    case 'notifications': {
      const notifications = mergeById(
        useNotificationStore.getState().notifications,
        items as AppNotification[],
      ).slice(0, 100);
      useNotificationStore.getState().replaceNotifications(notifications);
      break;
    }
    case 'linkedAccounts':
      useLinkedAccountStore.setState((state) => ({
        ...state,
        accounts: mergeById(state.accounts, items as LinkedAccount[]),
      }));
      break;
  }
};

const applyIncrementalEvent = (event: IncrementalSyncEvent) => {
  if (event.resource === 'appSettings' && event.action === 'upserted' && event.payload) {
    useSettingsStore.setState((state) => ({ ...state, ...event.payload }));
    return;
  }
  if (event.resource === 'budgetSettings' && event.action === 'upserted' && event.payload) {
    useBudgetStore.setState((state) => ({ ...state, ...event.payload }));
    return;
  }
  if (event.resource === 'groups' && event.action === 'deleted') {
    useGroupStore.setState((state) => ({
      ...state,
      groups: state.groups.filter((item) => item.id !== event.itemId),
      expenses: state.expenses.filter((item) => item.group_id !== event.itemId),
    }));
    return;
  }
  const resource = event.resource === 'groupExpenses' ? 'groupExpenses' : event.resource;
  if (!isBootstrapResource(resource)) return;
  if (event.action === 'upserted' && event.payload) {
    applyResourceItems(resource, [event.payload as Identified]);
  } else {
    removeResourceItem(resource, event.itemId);
  }
};

const removeResourceItem = (resource: BootstrapResource, itemId: string) => {
  switch (resource) {
    case 'transactions':
      useTransactionStore.setState((state) => ({
        ...state,
        transactions: state.transactions.filter((item) => item.id !== itemId),
      }));
      break;
    case 'notes':
      useNotesStore.setState((state) => ({ ...state, notes: state.notes.filter((item) => item.id !== itemId) }));
      break;
    case 'groups':
      useGroupStore.setState((state) => ({ ...state, groups: state.groups.filter((item) => item.id !== itemId) }));
      break;
    case 'groupExpenses':
      useGroupStore.setState((state) => ({ ...state, expenses: state.expenses.filter((item) => item.id !== itemId) }));
      break;
    case 'savings':
      useChallengeStore.setState((state) => {
        const challenges = state.challenges.filter((item) => item.id !== itemId);
        return { ...state, challenges, totalXP: calculateTotalXp(challenges) };
      });
      break;
    case 'badges':
      useBadgeStore.setState((state) => ({ ...state, badges: state.badges.filter((item) => item.id !== itemId) }));
      break;
    case 'notifications':
      useNotificationStore.getState().replaceNotifications(
        useNotificationStore.getState().notifications.filter((item) => item.id !== itemId),
      );
      break;
    case 'linkedAccounts':
      useLinkedAccountStore.setState((state) => ({ ...state, accounts: state.accounts.filter((item) => item.id !== itemId) }));
      break;
  }
};

const isBootstrapResource = (value: string): value is BootstrapResource =>
  ['transactions', 'notes', 'groups', 'groupExpenses', 'savings', 'badges', 'notifications', 'linkedAccounts'].includes(value);

const mergeById = <T extends Identified>(existing: T[], incoming: T[]): T[] => {
  const merged = new Map(existing.map((item) => [item.id, item]));
  incoming.forEach((item) => merged.set(item.id, { ...merged.get(item.id), ...item } as T));
  return Array.from(merged.values());
};

const calculateTotalXp = (challenges: Challenge[]) =>
  challenges.reduce((sum, item) => sum + (item.xp_earned ?? 0), 0);

const runWithConcurrency = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) => {
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      await worker(item);
    }
  });
  await Promise.all(runners);
};
