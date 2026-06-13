import { backendApi, isBackendConfigured } from './backendApi';
import type { AiChatRequest, AiChatResponse, AiModelStatusResponse, AiProviderStatus } from '@/features/ai/types';

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
};
