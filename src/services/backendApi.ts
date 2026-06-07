import { firebaseAuth } from './firebase';
import type { BackendBackupRecord, BackendSnapshot } from '@/types/backend';

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
};

export { BackendApiError };
