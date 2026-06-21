import { backendApi, isBackendConfigured } from './backendApi';
import type {
  AiAttachmentAnalyzeRequest,
  AiAttachmentAnalyzeResponse,
  AiAttachmentUploadResponse,
  AiBudgetCoachRequest,
  AiBudgetCoachResponse,
  AiChatRequest,
  AiChatResponse,
  AiDocumentSummarizeRequest,
  AiDocumentSummaryResponse,
  AiModelStatusResponse,
  AiOpsStatusResponse,
  AiProviderStatus,
  AiTransactionInsightsRequest,
  AiTransactionInsightsResponse,
} from '@/features/ai/types';

const routeNotFoundPattern = /route was not found|not_found|404/i;

function assertAiBackendConfigured(): void {
  if (!isBackendConfigured()) {
    throw new Error('AI needs the MoneyKai backend to be configured.');
  }
}

function isBackendRouteNotFound(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const status = 'status' in error ? Number((error as { status?: unknown }).status) : null;
  return status === 404 || routeNotFoundPattern.test(error.message);
}

const fallbackProviderStatus = (): AiProviderStatus => ({
  enabled: true,
  provider: 'moneykai-mobile',
  baseUrl: 'local',
  defaultTextModel: 'mobile-practical-review',
  defaultVisionModelConfigured: false,
  defaultFileModel: '',
  attachmentsEnabled: false,
  modelOverrideEnabled: false,
  configured: true,
});

const stripPromptStyleInstruction = (content: string): string =>
  content.replace(/\n\nStyle:\s+Reply in plain, natural text\.[\s\S]*$/i, '').trim();

const latestUserMessage = (payload: AiChatRequest): string => {
  const message = [...payload.messages].reverse().find((item) => item.role === 'user')?.content ?? '';
  return stripPromptStyleInstruction(message);
};

const buildLocalAiReply = (payload: AiChatRequest): AiChatResponse => {
  const prompt = latestUserMessage(payload);
  const focus = prompt.length > 0 ? prompt : 'your current money question';

  return {
    requestId: `mobile-local-${Date.now()}`,
    provider: 'moneykai-mobile',
    model: 'mobile-practical-review',
    message: [
      `Here is a practical MoneyKai review for: ${focus}`,
      '',
      '1. Start with the last 7 days of SMS records and separate essentials from optional spending.',
      '2. Put one clear cap on the category that is moving fastest, then review it again tomorrow.',
      '3. Do not treat this as financial advice. Use it as a checklist before making changes.',
    ].join('\n'),
    finishReason: 'fallback',
    usage: {
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    },
    annotations: [],
    providerMetadata: {
      fallback: true,
      reason: 'backend_ai_route_unavailable',
    },
    safety: {
      financialAdviceBoundaryApplied: true,
      reviewRequired: true,
    },
  };
};

export const aiClient = {
  getProviderStatus: async (): Promise<AiProviderStatus> => {
    assertAiBackendConfigured();
    try {
      return await backendApi.getAiProviderStatus();
    } catch (error) {
      if (isBackendRouteNotFound(error)) {
        return fallbackProviderStatus();
      }

      throw error;
    }
  },

  getModelStatus: async (): Promise<AiModelStatusResponse> => {
    assertAiBackendConfigured();
    return backendApi.getAiModelStatus();
  },

  getOpsStatus: async (): Promise<AiOpsStatusResponse> => {
    assertAiBackendConfigured();
    return backendApi.getAiOpsStatus();
  },

  chat: async (payload: AiChatRequest): Promise<AiChatResponse> => {
    assertAiBackendConfigured();
    try {
      return await backendApi.chatWithAi(payload);
    } catch (error) {
      if (isBackendRouteNotFound(error)) {
        return buildLocalAiReply(payload);
      }

      throw error;
    }
  },

  uploadAttachment: async (formData: FormData): Promise<AiAttachmentUploadResponse> => {
    assertAiBackendConfigured();
    return backendApi.uploadAiAttachment(formData);
  },

  analyzeAttachment: async (payload: AiAttachmentAnalyzeRequest): Promise<AiAttachmentAnalyzeResponse> => {
    assertAiBackendConfigured();
    return backendApi.analyzeAiAttachment(payload);
  },

  summarizeDocument: async (payload: AiDocumentSummarizeRequest): Promise<AiDocumentSummaryResponse> => {
    assertAiBackendConfigured();
    return backendApi.summarizeAiDocument(payload);
  },

  getTransactionInsights: async (payload: AiTransactionInsightsRequest): Promise<AiTransactionInsightsResponse> => {
    assertAiBackendConfigured();
    return backendApi.getAiTransactionInsights(payload);
  },

  getBudgetCoach: async (payload: AiBudgetCoachRequest): Promise<AiBudgetCoachResponse> => {
    assertAiBackendConfigured();
    return backendApi.getAiBudgetCoach(payload);
  },
};
