import { firebaseAuth } from './firebase';
import type { BackendBackupRecord, BackendSnapshot } from '@/types/backend';
import type { Group, GroupExpense } from '@/types/group';
import type { Challenge } from '@/types/challenge';
import type {
  AiAttachmentAnalyzeRequest,
  AiAttachmentAnalyzeResponse,
  AiAttachmentUploadResponse,
  AiBudgetCoachRequest,
  AiBudgetCoachResponse,
  AiChatRequest,
  AiChatResponse,
  AiChatStreamCompletedEvent,
  AiChatStreamEvent,
  AiDocumentSummarizeRequest,
  AiDocumentSummaryResponse,
  AiModelStatusResponse,
  AiOpsStatusResponse,
  AiProviderStatus,
  AiTransactionInsightsRequest,
  AiTransactionInsightsResponse,
} from '@/features/ai/types';

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
  const headers = new Headers(init.headers);
  const isFormDataBody = typeof FormData !== 'undefined' && init.body instanceof FormData;
  headers.set('Authorization', `Bearer ${token}`);
  if (!isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${backendBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Backend request failed with ${response.status}.`;
    try {
      const payload = await response.json();
      const detail = payload?.detail;
      message =
        (typeof detail === 'string' ? detail : detail?.message) ||
        payload?.message ||
        payload?.error?.message ||
        message;
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

async function streamRequest<TCompleted extends AiChatStreamCompletedEvent>(
  path: string,
  init: RequestInit,
  onEvent?: (event: AiChatStreamEvent) => void,
): Promise<TCompleted> {
  if (!isBackendConfigured()) {
    throw new Error('Backend API is not configured.');
  }

  const token = await getAuthToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'text/event-stream');

  const response = await fetch(`${backendBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Backend request failed with ${response.status}.`;
    try {
      const payload = await response.json();
      const detail = payload?.detail;
      message =
        (typeof detail === 'string' ? detail : detail?.message) ||
        payload?.message ||
        payload?.error?.message ||
        message;
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new BackendApiError(message, response.status);
  }

  if (!response.body) {
    throw new Error('Streaming is not available in this browser session.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completedEvent: TCompleted | null = null;

  const flushFrame = (frame: string) => {
    const parsed = parseSseFrame(frame);
    if (!parsed) {
      return;
    }
    onEvent?.(parsed);
    if (parsed.type === 'error') {
      throw new BackendApiError(parsed.error.message, 500);
    }
    if (parsed.type === 'completed') {
      completedEvent = parsed as TCompleted;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    let boundaryIndex = buffer.indexOf('\n\n');
    while (boundaryIndex >= 0) {
      const frame = buffer.slice(0, boundaryIndex);
      buffer = buffer.slice(boundaryIndex + 2);
      flushFrame(frame);
      boundaryIndex = buffer.indexOf('\n\n');
    }

    if (done) {
      break;
    }
  }

  if (buffer.trim()) {
    flushFrame(buffer.trim());
  }

  if (!completedEvent) {
    throw new Error('Streaming response ended before completion.');
  }

  return completedEvent;
}

function parseSseFrame(frame: string): AiChatStreamEvent | null {
  const lines = frame.split(/\r?\n/);
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(':')) {
      continue;
    }
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  const payload = JSON.parse(dataLines.join('\n')) as AiChatStreamEvent;
  if (eventName !== 'message' && payload.type !== eventName) {
    payload.type = eventName as AiChatStreamEvent['type'];
  }
  return payload;
}

export const backendApi = {
  getBootstrap: async () => request<BackendSnapshot>('/v1/bootstrap'),
  createBackup: async () => request<{ item: BackendBackupRecord }>('/v1/backups', { method: 'POST' }),
  getLatestBackup: async () => request<{ item: BackendBackupRecord }>('/v1/backups/latest'),
  restoreLatestBackup: async () => request<{ item: BackendSnapshot }>('/v1/backups/restore-latest', { method: 'POST' }),
  getAiProviderStatus: async () => request<AiProviderStatus>('/v1/ai/providers/status'),
  getAiModelStatus: async () => request<AiModelStatusResponse>('/v1/ai/models/status'),
  getAiOpsStatus: async () => request<AiOpsStatusResponse>('/v1/ai/ops/status'),
  chatWithAi: async (payload: AiChatRequest) =>
    request<AiChatResponse>('/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  streamAiChat: async (payload: AiChatRequest, onEvent?: (event: AiChatStreamEvent) => void) =>
    streamRequest<AiChatStreamCompletedEvent>(
      '/v1/ai/chat/stream',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      onEvent
    ),
  uploadAiAttachment: async (formData: FormData) =>
    request<AiAttachmentUploadResponse>('/v1/ai/attachments/upload', {
      method: 'POST',
      body: formData,
    }),
  analyzeAiAttachment: async (payload: AiAttachmentAnalyzeRequest) =>
    request<AiAttachmentAnalyzeResponse>('/v1/ai/attachments/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  summarizeAiDocument: async (payload: AiDocumentSummarizeRequest) =>
    request<AiDocumentSummaryResponse>('/v1/ai/documents/summarize', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAiTransactionInsights: async (payload: AiTransactionInsightsRequest) =>
    request<AiTransactionInsightsResponse>('/v1/ai/transactions/insights', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAiBudgetCoach: async (payload: AiBudgetCoachRequest) =>
    request<AiBudgetCoachResponse>('/v1/ai/budgets/coach', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
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
