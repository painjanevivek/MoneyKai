import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { backendApi, BackendApiError } from './backendApi';
import type { PersistedAppSettings } from '@/stores/useSettingsStore';
import { useSyncStore } from '@/stores/useSyncStore';

const QUEUE_KEY = 'moneykai-sync-queue';
const MAX_ATTEMPTS = 5;

type ResourceName = 'transactions' | 'notes' | 'badges' | 'notifications';

type ResourceOperation =
  | {
      kind: 'resource';
      action: 'create';
      resource: ResourceName;
      payload: object;
    }
  | {
      kind: 'resource';
      action: 'update';
      resource: ResourceName;
      itemId: string;
      payload: object;
    }
  | {
      kind: 'resource';
      action: 'delete';
      resource: ResourceName;
      itemId: string;
    };

type GroupOperation =
  | {
      kind: 'group';
      action: 'create';
      payload: object;
    }
  | {
      kind: 'group';
      action: 'update';
      groupId: string;
      payload: object;
    }
  | {
      kind: 'group';
      action: 'delete' | 'archive' | 'restore';
      groupId: string;
    };

type GroupExpenseOperation =
  | {
      kind: 'groupExpense';
      action: 'create';
      groupId: string;
      payload: object;
    }
  | {
      kind: 'groupExpense';
      action: 'update';
      groupId: string;
      expenseId: string;
      payload: object;
    }
  | {
      kind: 'groupExpense';
      action: 'delete';
      groupId: string;
      expenseId: string;
    };

type ChallengeOperation =
  | {
      kind: 'challenge';
      action: 'create';
      payload: object;
    }
  | {
      kind: 'challenge';
      action: 'update';
      challengeId: string;
      payload: object;
    }
  | {
      kind: 'challenge';
      action: 'delete' | 'deactivate' | 'reactivate';
      challengeId: string;
    }
  | {
      kind: 'challenge';
      action: 'complete';
      challengeId: string;
      payload: object;
    };

type SyncOperation =
  | ResourceOperation
  | GroupOperation
  | GroupExpenseOperation
  | ChallengeOperation
  | { kind: 'appSettings'; payload: PersistedAppSettings }
  | { kind: 'budgetSettings'; payload: object };

type QueueOperation = SyncOperation;

type QueueEntry = SyncOperation & {
  id: string;
  attempts: number;
  createdAt: string;
  lastError?: string;
};

const loadQueue = async (): Promise<QueueEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueueEntry[]) : [];
  } catch {
    return [];
  }
};

const saveQueue = async (entries: QueueEntry[]) => {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(entries));
  useSyncStore.getState().setPendingCount(entries.length);
};

const createId = () => `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const canRetryError = (error: unknown): boolean => {
  if (error instanceof BackendApiError) {
    return error.status === 0 || error.status >= 500;
  }
  if (error instanceof Error) {
    return /network|fetch|timeout|offline|failed to fetch/i.test(error.message);
  }
  return false;
};

const runOperation = async (operation: SyncOperation) => {
  switch (operation.kind) {
    case 'resource':
      if (operation.action === 'create') {
        await backendApi.createResource(operation.resource, operation.payload ?? {});
      } else if (operation.action === 'update') {
        if (!operation.itemId) throw new Error('Missing item id for update');
        await backendApi.updateResource(operation.resource, operation.itemId, operation.payload ?? {});
      } else {
        if (!operation.itemId) throw new Error('Missing item id for delete');
        await backendApi.deleteResource(operation.resource, operation.itemId);
      }
      return;
    case 'group':
      if (operation.action === 'create') {
        await backendApi.createGroup(operation.payload ?? {});
      } else if (operation.action === 'update') {
        if (!operation.groupId) throw new Error('Missing group id for update');
        await backendApi.updateGroup(operation.groupId, operation.payload ?? {});
      } else if (operation.action === 'delete') {
        if (!operation.groupId) throw new Error('Missing group id for delete');
        await backendApi.deleteGroup(operation.groupId);
      } else if (operation.action === 'archive') {
        if (!operation.groupId) throw new Error('Missing group id for archive');
        await backendApi.archiveGroup(operation.groupId);
      } else {
        if (!operation.groupId) throw new Error('Missing group id for restore');
        await backendApi.restoreGroup(operation.groupId);
      }
      return;
    case 'groupExpense':
      if (operation.action === 'create') {
        await backendApi.createGroupExpense(operation.groupId, operation.payload ?? {});
      } else if (operation.action === 'update') {
        if (!operation.expenseId) throw new Error('Missing expense id for update');
        await backendApi.updateGroupExpense(operation.groupId, operation.expenseId, operation.payload ?? {});
      } else {
        if (!operation.expenseId) throw new Error('Missing expense id for delete');
        await backendApi.deleteGroupExpense(operation.groupId, operation.expenseId);
      }
      return;
    case 'challenge':
      if (operation.action === 'create') {
        await backendApi.createChallenge(operation.payload ?? {});
      } else if (operation.action === 'update') {
        if (!operation.challengeId) throw new Error('Missing challenge id for update');
        await backendApi.updateChallenge(operation.challengeId, operation.payload ?? {});
      } else if (operation.action === 'delete') {
        if (!operation.challengeId) throw new Error('Missing challenge id for delete');
        await backendApi.deleteChallenge(operation.challengeId);
      } else if (operation.action === 'deactivate') {
        if (!operation.challengeId) throw new Error('Missing challenge id for deactivate');
        await backendApi.deactivateChallenge(operation.challengeId);
      } else if (operation.action === 'reactivate') {
        if (!operation.challengeId) throw new Error('Missing challenge id for reactivate');
        await backendApi.reactivateChallenge(operation.challengeId);
      } else if (operation.action === 'complete') {
        if (!operation.challengeId) throw new Error('Missing challenge id for completion');
        await backendApi.completeChallenge(operation.challengeId, operation.payload);
      } else {
        throw new Error('Unsupported challenge sync operation');
      }
      return;
    case 'appSettings':
      await backendApi.updateAppSettings(operation.payload);
      return;
    case 'budgetSettings':
      await backendApi.updateBudgetSettings(operation.payload);
      return;
  }
};

export const queueSyncOperation = async (operation: QueueOperation) => {
  const entry: QueueEntry = {
    ...operation,
    id: createId(),
    attempts: 0,
    createdAt: new Date().toISOString(),
  };

  const queue = await loadQueue();
  queue.push(entry);
  await saveQueue(queue);
};

export const flushSyncQueue = async () => {
  const networkState = await NetInfo.fetch().catch(() => null);
  if (networkState && (networkState.isConnected === false || networkState.isInternetReachable === false)) {
    return;
  }

  let queue = await loadQueue();
  if (queue.length === 0) {
    useSyncStore.getState().setPendingCount(0);
    return;
  }

  const nextQueue: QueueEntry[] = [];
  let syncedAny = false;

  for (const entry of queue) {
    try {
      await runOperation(entry);
      syncedAny = true;
    } catch (error) {
      const retriable = canRetryError(error);
      if (retriable && entry.attempts + 1 < MAX_ATTEMPTS) {
        nextQueue.push({
          ...entry,
          attempts: entry.attempts + 1,
          lastError: error instanceof Error ? error.message : 'Sync failed',
        });
      }
      if (!retriable) {
        if (__DEV__) {
          console.warn('[MoneyKai] dropping non-retriable sync operation:', error);
        }
      }
    }
  }

  queue = nextQueue;
  await saveQueue(queue);

  if (syncedAny) {
    useSyncStore.getState().finishSync();
  }
};

export const clearSyncQueue = async () => {
  await AsyncStorage.removeItem(QUEUE_KEY);
  useSyncStore.getState().setPendingCount(0);
};
