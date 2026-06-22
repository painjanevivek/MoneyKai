import { backendApi, isBackendConfigured } from './backendApi';
import type {
  AiAttachmentAnalyzeRequest,
  AiAttachmentAnalyzeResponse,
  AiAttachmentFileAnalyzeRequest,
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

const shouldFallbackToInlineAttachment = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /route was not found|vercel site|upload.*not configured|AI_BACKEND_NOT_CONFIGURED/i.test(message);
};

const readFileAsInlineAttachment = (
  file: File,
  metadata: { filename: string; mimeType: string },
): Promise<{ filename: string; mimeType: string; dataUrl: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reject(new Error('Could not read this image. Try a different receipt or screenshot.'));
    };
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl.startsWith(`data:${metadata.mimeType};base64,`)) {
        reject(new Error('Could not prepare this image for AI review. Try a PNG, JPEG, WebP, or GIF file.'));
        return;
      }
      resolve({
        filename: metadata.filename,
        mimeType: metadata.mimeType,
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
  });

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
    signal?: AbortSignal,
    onEvent?: (event: AiChatStreamEvent) => void,
  ): Promise<AiChatStreamCompletedEvent> => {
    assertAiBackendConfigured();
    return backendApi.streamAiChat(payload, signal, onEvent);
  },

  uploadAttachment: async (formData: FormData): Promise<AiAttachmentUploadResponse> => {
    assertAiBackendConfigured();
    return backendApi.uploadAiAttachment(formData);
  },

  uploadAttachmentFile: async (file: File, filename = file.name): Promise<AiAttachmentUploadResponse> => {
    assertAiBackendConfigured();
    const formData = new FormData();
    formData.append('file', file, filename);
    return backendApi.uploadAiAttachment(formData);
  },

  analyzeAttachment: async (payload: AiAttachmentAnalyzeRequest): Promise<AiAttachmentAnalyzeResponse> => {
    assertAiBackendConfigured();
    return backendApi.analyzeAiAttachment(payload);
  },

  analyzeAttachmentFile: async ({
    file,
    filename = file.name,
    mimeType = file.type || 'image/jpeg',
    request,
  }: AiAttachmentFileAnalyzeRequest): Promise<AiAttachmentAnalyzeResponse> => {
    assertAiBackendConfigured();

    try {
      const formData = new FormData();
      formData.append('file', file, filename);
      const uploaded = await backendApi.uploadAiAttachment(formData);

      return backendApi.analyzeAiAttachment({
        ...request,
        attachmentIds: [uploaded.attachmentId],
      });
    } catch (error) {
      if (!shouldFallbackToInlineAttachment(error)) {
        throw error;
      }

      const inlineAttachment = await readFileAsInlineAttachment(file, { filename, mimeType });
      return backendApi.analyzeAiAttachment({
        ...request,
        inlineAttachments: [inlineAttachment],
      });
    }
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
