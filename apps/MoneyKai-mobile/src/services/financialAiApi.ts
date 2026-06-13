import { isFinancialAiEnabled, isWealthTabEnabled } from '@/config/environment';
import { backendApi } from './backendApi';
import type {
  AiEmailClassificationRequest,
  AiEmailClassificationResult,
  AiStatementRowsRequest,
  AiStatementRowsResponse,
  AiWealthInsightRequest,
  AiWealthInsightResponse,
} from '@/types/financialAi';

export const financialAiApi = {
  classifyEmail: async (payload: AiEmailClassificationRequest): Promise<AiEmailClassificationResult> => {
    if (!isFinancialAiEnabled()) {
      throw new Error('Financial AI is disabled for this build.');
    }
    return backendApi.classifyFinancialEmailWithAi(payload);
  },

  interpretStatementRows: async (payload: AiStatementRowsRequest): Promise<AiStatementRowsResponse> => {
    if (!isFinancialAiEnabled()) {
      throw new Error('Financial AI is disabled for this build.');
    }
    return backendApi.interpretStatementRowsWithAi(payload);
  },

  generateWealthInsights: async (payload: AiWealthInsightRequest): Promise<AiWealthInsightResponse> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    return backendApi.generateAiWealthInsights(payload);
  },
};
