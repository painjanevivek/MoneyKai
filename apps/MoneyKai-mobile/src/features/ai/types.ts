export type AiChatTask = 'general_chat' | 'transaction_insights' | 'budget_coach' | 'portfolio_explainer';

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

export interface AiErrorPayload {
  code?: string;
  message?: string;
  requestId?: string;
}
