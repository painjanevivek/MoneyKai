export type AiChatTask = 'general_chat' | 'transaction_insights' | 'budget_coach' | 'portfolio_explainer';
export type AiAttachmentAnalyzeTask = 'receipt_extract' | 'image_analysis';
export type AiDocumentSummaryType = 'financial_statement' | 'general';

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
  configured: boolean;
  available: boolean;
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
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

export interface AiErrorPayload {
  code?: string;
  message?: string;
  requestId?: string;
}
