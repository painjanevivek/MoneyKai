export type AiChatTask = 'general_chat' | 'transaction_insights' | 'budget_coach' | 'portfolio_explainer';
export type AiAttachmentAnalyzeTask = 'receipt_extract' | 'image_analysis';
export type AiDocumentSummaryType = 'financial_statement' | 'general';
export type AiInsightTone = 'info' | 'warning' | 'success';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  task?: AiChatTask;
  messages: AiChatMessage[];
  context?: Record<string, unknown>;
  model?: string;
}

export interface AiUsage {
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
}

export interface AiChatResponse {
  requestId: string;
  provider: string;
  model: string;
  message: string;
  finishReason?: string | null;
  usage: AiUsage;
  annotations: Record<string, unknown>[];
  providerMetadata: Record<string, unknown>;
  safety: Record<string, unknown> & {
    financialAdviceBoundaryApplied?: boolean;
    reviewRequired?: boolean;
  };
}

export interface AiChatStreamErrorPayload {
  code: string;
  message: string;
  requestId?: string | null;
}

export interface AiChatStreamMetaEvent {
  type: 'meta';
  requestId: string;
  provider?: string | null;
  model?: string | null;
  providerMetadata: Record<string, unknown>;
  safety: Record<string, unknown>;
}

export interface AiChatStreamDeltaEvent {
  type: 'delta';
  requestId: string;
  provider?: string | null;
  model?: string | null;
  delta: string;
}

export interface AiChatStreamCompletedEvent {
  type: 'completed';
  requestId: string;
  provider?: string | null;
  model?: string | null;
  message: string;
  finishReason?: string | null;
  usage?: AiUsage | null;
  providerMetadata: Record<string, unknown>;
  safety: Record<string, unknown>;
}

export interface AiChatStreamErrorEvent {
  type: 'error';
  requestId?: string | null;
  error: AiChatStreamErrorPayload;
}

export type AiChatStreamEvent =
  | AiChatStreamMetaEvent
  | AiChatStreamDeltaEvent
  | AiChatStreamCompletedEvent
  | AiChatStreamErrorEvent;

export interface AiProviderStatus {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  defaultTextModel: string;
  defaultVisionModelConfigured: boolean;
  defaultFileModel: string;
  attachmentsEnabled: boolean;
  modelOverrideEnabled: boolean;
  configured: boolean;
}

export interface AiConfiguredModelStatus {
  key: 'text' | 'vision' | 'file' | 'reasoning' | 'sms_parse';
  model: string | null;
  canonicalSlug?: string | null;
  configured: boolean;
  available: boolean;
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
  expirationDate?: string | null;
  deprecationState?: 'active' | 'scheduled' | 'expired';
  reason?: string | null;
}

export interface AiModelStatusResponse {
  models: AiConfiguredModelStatus[];
  discoveryOk: boolean;
  discoverySource: 'openrouter' | 'fallback';
  discoveryError?: string | null;
}

export interface AiAttachmentUploadResponse {
  attachmentId: string;
  kind: 'image' | 'file' | 'text';
  filename: string;
  mimeType: string;
  sizeBytes: number;
  expiresAt: string;
}

export interface AiAttachmentAnalyzeRequest {
  message: string;
  attachmentIds: string[];
  inlineAttachments?: {
    filename: string;
    mimeType: string;
    dataUrl: string;
  }[];
  task?: AiAttachmentAnalyzeTask;
  context?: Record<string, unknown>;
}

export interface AiReceiptExtraction {
  merchant?: string | null;
  date?: string | null;
  amount?: number | null;
  currency?: string | null;
  category?: string | null;
}

export interface AiAttachmentAnalyzeResponse {
  requestId: string;
  message: string;
  structured?: AiReceiptExtraction | null;
  reviewRequired: true;
  model: string;
  warnings: string[];
}

export interface AiDocumentSummarizeRequest {
  attachmentId: string;
  summaryType?: AiDocumentSummaryType;
  userConsent: boolean;
  password?: string;
}

export interface AiDocumentDetectedFields {
  period?: string | null;
  openingBalance?: number | null;
  closingBalance?: number | null;
  totalCredits?: number | null;
  totalDebits?: number | null;
}

export interface AiDocumentSummaryResponse {
  requestId: string;
  summary: string;
  detectedFields: AiDocumentDetectedFields;
  warnings: string[];
  reviewRequired: true;
  model: string;
}

export interface AiCategoryTotalInput {
  category: string;
  total: number;
  count?: number;
  percentage?: number | null;
}

export interface AiInsightCard {
  id: string;
  tone: AiInsightTone;
  title: string;
  body: string;
  actionLabel?: string | null;
  metricLabel?: string | null;
  metricValue?: string | null;
}

export interface AiTransactionInsightsRequest {
  month: string;
  currency?: string;
  totalSpent: number;
  totalIncome: number;
  categoryTotals: AiCategoryTotalInput[];
  previousMonthSpent?: number | null;
  previousMonthCategoryTotals?: AiCategoryTotalInput[];
  context?: Record<string, unknown>;
}

export interface AiTransactionInsightsResponse {
  requestId: string;
  cards: AiInsightCard[];
  reviewRequired: true;
  source: 'ai' | 'deterministic';
  cached: boolean;
  model?: string | null;
}

export interface AiBudgetCoachRequest {
  month: string;
  currency?: string;
  monthlyAllowance: number;
  totalSpent: number;
  daysElapsed: number;
  daysRemaining: number;
  categoryTotals: AiCategoryTotalInput[];
  emergencyMode?: boolean;
  targetSavings?: number | null;
  context?: Record<string, unknown>;
}

export interface AiBudgetCoachResponse {
  requestId: string;
  cards: AiInsightCard[];
  reviewRequired: true;
  source: 'ai' | 'deterministic';
  cached: boolean;
  model?: string | null;
}

export interface AiRuntimeCounters {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  quotaRejectedRequests: number;
  activeStreamRequests: number;
}

export interface AiAttachmentCleanupStatus {
  lastRunAt?: string | null;
  deletedAttachments: number;
  failedRuns: number;
}

export interface AiOpsAlert {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface AiOpsStatusResponse {
  generatedAt: string;
  limiterBackend: string;
  counters: AiRuntimeCounters;
  recentErrorCodes: Record<string, number>;
  recentQuotaRejections: number;
  lastErrorCode?: string | null;
  attachmentCleanup: AiAttachmentCleanupStatus;
  alerts: AiOpsAlert[];
  models: AiConfiguredModelStatus[];
  discoveryOk: boolean;
  discoverySource: 'openrouter' | 'fallback';
  discoveryError?: string | null;
}

export interface AiErrorPayload {
  code?: string;
  message?: string;
  requestId?: string;
}
