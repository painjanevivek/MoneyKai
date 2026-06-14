import { backendApi, isBackendConfigured } from './backendApi';
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

function assertAiBackendConfigured(): void {
  if (!isBackendConfigured()) {
    throw new Error('AI needs the MoneyKai backend to be configured.');
  }
}

export const aiClient = {
  getProviderStatus: async (): Promise<AiProviderStatus> => {
    assertAiBackendConfigured();
    return backendApi.getAiProviderStatus();
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
    return backendApi.chatWithAi(payload);
  },

  streamChat: async (
    payload: AiChatRequest,
    onEvent?: (event: AiChatStreamEvent) => void,
  ): Promise<AiChatStreamCompletedEvent> => {
    assertAiBackendConfigured();
    return backendApi.streamAiChat(payload, onEvent);
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
