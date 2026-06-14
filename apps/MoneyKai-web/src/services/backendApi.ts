import { firebaseAuth } from './firebase';
import { getBackendBaseUrl } from '@/config/environment';
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
import type {
  FinancialDocument,
  FinancialDocumentAiSummaryRequest,
  FinancialDocumentAiSummaryResult,
  FinancialDocumentStatusSummary,
  ParsedStatementImportRequest,
  ParsedStatementReviewActionResponse,
  ParsedStatementReviewResponse,
  ParseFinancialDocumentRequest,
  PdfPasswordAttemptRequest,
  PdfPasswordAttemptResponse,
  PdfPasswordProfile,
  QueueGmailAttachmentsRequest,
  QueueGmailAttachmentsResponse,
} from '@/types/financialDocument';
import type {
  FinancialEmailListResponse,
  GmailConnectStartResponse,
  GmailSyncRequest,
  GmailSyncStatus,
  GmailSyncSummary,
} from '@/types/gmail';
import type {
  AccountAggregatorExplorationStatus,
  PortfolioAccount,
  PortfolioHolding,
  PortfolioHoldingDraft,
  PortfolioHoldingUpdate,
  PortfolioStateResponse,
  ProviderConnectionDraft,
  ProviderConnectionUpdate,
  ProviderSyncResponse,
  WealthSnapshot,
  ZerodhaConnectCallbackRequest,
  ZerodhaConnectCallbackResponse,
  ZerodhaConnectStartResponse,
} from '@/types/portfolio';
import type {
  AiEmailClassificationRequest,
  AiEmailClassificationResult,
  AiStatementRowsRequest,
  AiStatementRowsResponse,
  AiWealthInsightRequest,
  AiWealthInsightResponse,
} from '@/types/financialAi';

const backendBaseUrl = getBackendBaseUrl();

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

const messageFromPayload = (payload: any, fallback: string): string => {
  const detail = payload?.detail;
  return (
    (typeof detail === 'string' ? detail : detail?.message) ||
    payload?.message ||
    payload?.error?.message ||
    fallback
  );
};

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const text = await response.text().catch(() => '');
  if (!text) {
    return fallback;
  }

  try {
    return messageFromPayload(JSON.parse(text), fallback);
  } catch {
    return text;
  }
};

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
    const message = await parseErrorMessage(response, `Backend request failed with ${response.status}.`);
    throw new BackendApiError(message, response.status);
  }

  return (await response.json()) as T;
}

async function streamRequest<TCompleted extends AiChatStreamCompletedEvent>(
  path: string,
  init: RequestInit,
  signal?: AbortSignal,
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
    signal,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response, `Backend request failed with ${response.status}.`);
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

  try {
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
  } finally {
    reader.releaseLock();
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
  streamAiChat: async (
    payload: AiChatRequest,
    signal?: AbortSignal,
    onEvent?: (event: AiChatStreamEvent) => void,
  ) =>
    streamRequest<AiChatStreamCompletedEvent>(
      '/v1/ai/chat/stream',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      signal,
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
  getGmailStatus: async () => request<GmailSyncStatus>('/v1/gmail/status'),
  startGmailConnect: async (metadataScanAcceptedAt: string) =>
    request<GmailConnectStartResponse>(
      `/v1/gmail/connect/start?metadataScanAcceptedAt=${encodeURIComponent(metadataScanAcceptedAt)}`
    ),
  disconnectGmail: async () => request<{ disconnected: boolean }>('/v1/gmail/disconnect', { method: 'POST' }),
  syncGmail: async (payload: GmailSyncRequest) =>
    request<GmailSyncSummary>('/v1/gmail/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listGmailEmails: async (parseStatus?: string) =>
    request<FinancialEmailListResponse>(
      parseStatus ? `/v1/gmail/emails?parseStatus=${encodeURIComponent(parseStatus)}` : '/v1/gmail/emails'
    ),
  getFinancialDocumentStatus: async () =>
    request<FinancialDocumentStatusSummary>('/v1/financial-documents/status'),
  listFinancialDocuments: async (status?: string) =>
    request<{ items: FinancialDocument[] }>(
      status ? `/v1/financial-documents?status=${encodeURIComponent(status)}` : '/v1/financial-documents'
    ),
  queueGmailAttachments: async (payload: QueueGmailAttachmentsRequest) =>
    request<QueueGmailAttachmentsResponse>('/v1/financial-documents/queue-gmail-attachments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  parseFinancialDocument: async (documentId: string, payload: ParseFinancialDocumentRequest) =>
    request<ParsedStatementReviewResponse>(`/v1/financial-documents/${documentId}/parse`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  summarizeFinancialDocumentAi: async (documentId: string, payload: FinancialDocumentAiSummaryRequest) =>
    request<FinancialDocumentAiSummaryResult>(`/v1/financial-documents/${documentId}/ai-summary`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitPdfPassword: async (documentId: string, payload: PdfPasswordAttemptRequest) =>
    request<PdfPasswordAttemptResponse>(`/v1/financial-documents/${documentId}/password`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getParsedStatementReview: async (documentId: string) =>
    request<ParsedStatementReviewResponse>(`/v1/financial-documents/${documentId}/review`),
  approveParsedStatementReview: async (documentId: string) =>
    request<ParsedStatementReviewActionResponse>(`/v1/financial-documents/${documentId}/review/approve`, {
      method: 'POST',
    }),
  ignoreParsedStatementReview: async (documentId: string) =>
    request<ParsedStatementReviewActionResponse>(`/v1/financial-documents/${documentId}/review/ignore`, {
      method: 'POST',
    }),
  importParsedStatementReview: async (documentId: string, payload: ParsedStatementImportRequest) =>
    request<ParsedStatementReviewActionResponse>(`/v1/financial-documents/${documentId}/review/import`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listPdfPasswordProfiles: async () =>
    request<{ items: PdfPasswordProfile[] }>('/v1/financial-documents/password-profiles'),
  deletePdfPasswordProfile: async (profileId: string) =>
    request<{ deleted: boolean }>(`/v1/financial-documents/password-profiles/${profileId}`, {
      method: 'DELETE',
    }),
  listPortfolioConnections: async () => request<{ items: PortfolioAccount[] }>('/v1/portfolio/connections'),
  getPortfolioState: async () => request<PortfolioStateResponse>('/v1/portfolio/state'),
  createPortfolioConnection: async (payload: ProviderConnectionDraft) =>
    request<{ item: PortfolioAccount }>('/v1/portfolio/connections', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePortfolioConnection: async (accountId: string, payload: ProviderConnectionUpdate) =>
    request<{ item: PortfolioAccount }>(`/v1/portfolio/connections/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  pausePortfolioConnection: async (accountId: string) =>
    request<{ item: PortfolioAccount }>(`/v1/portfolio/connections/${accountId}/pause`, { method: 'POST' }),
  disconnectPortfolioConnection: async (accountId: string) =>
    request<{ item: PortfolioAccount }>(`/v1/portfolio/connections/${accountId}/disconnect`, { method: 'POST' }),
  syncPortfolioConnection: async (accountId: string) =>
    request<ProviderSyncResponse>(`/v1/portfolio/connections/${accountId}/sync`, { method: 'POST' }),
  listPortfolioHoldings: async () => request<{ items: PortfolioHolding[] }>('/v1/portfolio/holdings'),
  createPortfolioHolding: async (payload: PortfolioHoldingDraft) =>
    request<{ item: PortfolioHolding }>('/v1/portfolio/holdings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePortfolioHolding: async (holdingId: string, payload: PortfolioHoldingUpdate) =>
    request<{ item: PortfolioHolding }>(`/v1/portfolio/holdings/${holdingId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deletePortfolioHolding: async (holdingId: string) =>
    request<{ deleted: boolean }>(`/v1/portfolio/holdings/${holdingId}`, { method: 'DELETE' }),
  createWealthSnapshot: async () => request<WealthSnapshot>('/v1/portfolio/snapshots', { method: 'POST' }),
  importParsedDocumentHoldings: async (documentId: string) =>
    request<{ items: PortfolioHolding[]; importedCount: number }>(`/v1/portfolio/imports/parsed-document/${documentId}`, {
      method: 'POST',
    }),
  startZerodhaConnect: async () =>
    request<ZerodhaConnectStartResponse>('/v1/portfolio/providers/zerodha/start', { method: 'POST' }),
  completeZerodhaConnect: async (payload: ZerodhaConnectCallbackRequest) =>
    request<ZerodhaConnectCallbackResponse>('/v1/portfolio/providers/zerodha/callback', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAccountAggregatorExploration: async () =>
    request<AccountAggregatorExplorationStatus>('/v1/portfolio/providers/account-aggregator/exploration'),
  classifyFinancialEmailWithAi: async (payload: AiEmailClassificationRequest) =>
    request<AiEmailClassificationResult>('/v1/financial-ai/email-classification', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  interpretStatementRowsWithAi: async (payload: AiStatementRowsRequest) =>
    request<AiStatementRowsResponse>('/v1/financial-ai/statement-rows', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  generateAiWealthInsights: async (payload: AiWealthInsightRequest) =>
    request<AiWealthInsightResponse>('/v1/financial-ai/wealth-insights', {
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
