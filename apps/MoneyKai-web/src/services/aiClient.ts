import { backendApi, isBackendConfigured } from './backendApi';
import type {
  AiAttachmentAnalyzeRequest,
  AiAttachmentAnalyzeResponse,
  AiAttachmentUploadResponse,
  AiChatRequest,
  AiChatResponse,
  AiDocumentSummarizeRequest,
  AiDocumentSummaryResponse,
  AiModelStatusResponse,
  AiProviderStatus,
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

  chat: async (payload: AiChatRequest): Promise<AiChatResponse> => {
    assertAiBackendConfigured();
    return backendApi.chatWithAi(payload);
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
};
