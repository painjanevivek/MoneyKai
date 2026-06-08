import { firebaseAuth } from './firebase';
import type { BackendBackupRecord, BackendSnapshot } from '@/types/backend';
import type { Group, GroupExpense } from '@/types/group';
import type { Challenge } from '@/types/challenge';

const rawBaseUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL?.trim() || '';
const backendBaseUrl = rawBaseUrl.replace(/\/$/, '');

export const isBackendConfigured = (): boolean => backendBaseUrl.length > 0;

class BackendApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'BackendApiError';
  }
}

async function getAuthToken(): Promise<string> {
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) {
    throw new Error('You need to be signed in to call the backend.');
  }

  return currentUser.getIdToken();
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isBackendConfigured()) {
    throw new Error('Backend API is not configured.');
  }

  const token = await getAuthToken();
  const response = await fetch(`${backendBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Backend request failed with ${response.status}.`;
    try {
      const payload = await response.json();
      message = payload?.detail || payload?.message || message;
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new BackendApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export const backendApi = {
  getBootstrap: async () => request<BackendSnapshot>('/v1/bootstrap'),
  createBackup: async () => request<{ item: BackendBackupRecord }>('/v1/backups', { method: 'POST' }),
  getLatestBackup: async () => request<{ item: BackendBackupRecord }>('/v1/backups/latest'),
  restoreLatestBackup: async () => request<{ item: BackendSnapshot }>('/v1/backups/restore-latest', { method: 'POST' }),
  updateAppSettings: async (payload: Record<string, unknown>) =>
    request<{ app: Record<string, unknown> }>('/v1/settings/app', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateBudgetSettings: async (payload: Record<string, unknown>) =>
    request<{ budget: Record<string, unknown> }>('/v1/settings/budget', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteAccount: async () =>
    request<{ deleted: boolean }>('/v1/settings/account', {
      method: 'DELETE',
    }),
  listResource: async <T>(resource: 'transactions' | 'notes' | 'badges' | 'notifications') =>
    request<{ items: T[] }>(`/v1/resources/${resource}`),
  createResource: async <T>(resource: 'transactions' | 'notes' | 'badges' | 'notifications', payload: object) =>
    request<{ item: T }>(`/v1/resources/${resource}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateResource: async <T>(
    resource: 'transactions' | 'notes' | 'badges' | 'notifications',
    itemId: string,
    payload: object,
  ) =>
    request<{ item: T }>(`/v1/resources/${resource}/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteResource: async (resource: 'transactions' | 'notes' | 'badges' | 'notifications', itemId: string) =>
    request<{ deleted: boolean }>(`/v1/resources/${resource}/${itemId}`, {
      method: 'DELETE',
    }),
  listGroups: async () => request<{ items: Group[] }>('/v1/groups'),
  createGroup: async (payload: object) =>
    request<{ item: Group }>('/v1/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateGroup: async (groupId: string, payload: object) =>
    request<{ item: Group }>(`/v1/groups/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteGroup: async (groupId: string) =>
    request<{ deleted: boolean }>(`/v1/groups/${groupId}`, {
      method: 'DELETE',
    }),
  archiveGroup: async (groupId: string) =>
    request<{ item: Group }>(`/v1/groups/${groupId}/archive`, {
      method: 'POST',
    }),
  restoreGroup: async (groupId: string) =>
    request<{ item: Group }>(`/v1/groups/${groupId}/restore`, {
      method: 'POST',
    }),
  listGroupExpenses: async (groupId: string) => request<{ items: GroupExpense[] }>(`/v1/groups/${groupId}/expenses`),
  createGroupExpense: async (groupId: string, payload: object) =>
    request<{ item: GroupExpense }>(`/v1/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateGroupExpense: async (groupId: string, expenseId: string, payload: object) =>
    request<{ item: GroupExpense }>(`/v1/groups/${groupId}/expenses/${expenseId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteGroupExpense: async (groupId: string, expenseId: string) =>
    request<{ deleted: boolean }>(`/v1/groups/${groupId}/expenses/${expenseId}`, {
      method: 'DELETE',
    }),
  listChallenges: async () => request<{ items: Challenge[] }>('/v1/challenges'),
  createChallenge: async (payload: object) =>
    request<{ item: Challenge }>('/v1/challenges', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateChallenge: async (challengeId: string, payload: object) =>
    request<{ item: Challenge }>(`/v1/challenges/${challengeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteChallenge: async (challengeId: string) =>
    request<{ deleted: boolean }>(`/v1/challenges/${challengeId}`, {
      method: 'DELETE',
    }),
  deactivateChallenge: async (challengeId: string) =>
    request<{ item: Challenge }>(`/v1/challenges/${challengeId}/deactivate`, {
      method: 'POST',
    }),
  reactivateChallenge: async (challengeId: string) =>
    request<{ item: Challenge }>(`/v1/challenges/${challengeId}/reactivate`, {
      method: 'POST',
    }),
  completeChallenge: async (challengeId: string, payload: object) =>
    request<{ item: Challenge }>(`/v1/challenges/${challengeId}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export { BackendApiError };
