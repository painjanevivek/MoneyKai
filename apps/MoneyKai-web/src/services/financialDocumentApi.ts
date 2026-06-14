import { isPdfStatementParsingEnabled } from '@/config/environment';
import { backendApi } from './backendApi';
import type {
  FinancialDocument,
  FinancialDocumentAiSummaryRequest,
  FinancialDocumentAiSummaryResult,
  FinancialDocumentStatusSummary,
  ParsedStatementImportRequest,
  ParsedStatementReviewActionResponse,
  ParsedStatementReviewResponse,
  ParseFinancialDocumentRequest,
  PdfPasswordProfile,
  PdfPasswordAttemptRequest,
  PdfPasswordAttemptResponse,
  QueueGmailAttachmentsRequest,
  QueueGmailAttachmentsResponse,
} from '@/types/financialDocument';

export const financialDocumentApi = {
  getStatus: async (): Promise<FinancialDocumentStatusSummary> => {
    if (!isPdfStatementParsingEnabled()) {
      return {
        enabled: false,
        queuedCount: 0,
        needsPasswordCount: 0,
        reviewRequiredCount: 0,
        importedCount: 0,
      };
    }

    return backendApi.getFinancialDocumentStatus();
  },

  listDocuments: async (status?: string): Promise<FinancialDocument[]> => {
    if (!isPdfStatementParsingEnabled()) {
      return [];
    }
    const response = await backendApi.listFinancialDocuments(status);
    return response.items;
  },

  queueGmailAttachments: async (payload: QueueGmailAttachmentsRequest): Promise<QueueGmailAttachmentsResponse> => {
    if (!isPdfStatementParsingEnabled()) {
      throw new Error('PDF statement parsing is disabled for this build.');
    }
    return backendApi.queueGmailAttachments(payload);
  },

  parseDocument: async (documentId: string, payload: ParseFinancialDocumentRequest): Promise<ParsedStatementReviewResponse> => {
    if (!isPdfStatementParsingEnabled()) {
      throw new Error('PDF statement parsing is disabled for this build.');
    }
    return backendApi.parseFinancialDocument(documentId, payload);
  },

  summarizeDocumentAi: async (documentId: string, payload: FinancialDocumentAiSummaryRequest): Promise<FinancialDocumentAiSummaryResult> => {
    if (!isPdfStatementParsingEnabled()) {
      throw new Error('PDF statement parsing is disabled for this build.');
    }
    return backendApi.summarizeFinancialDocumentAi(documentId, payload);
  },

  submitPassword: async (documentId: string, payload: PdfPasswordAttemptRequest): Promise<PdfPasswordAttemptResponse> => {
    if (!isPdfStatementParsingEnabled()) {
      throw new Error('PDF statement parsing is disabled for this build.');
    }
    return backendApi.submitPdfPassword(documentId, payload);
  },

  getReview: async (documentId: string): Promise<ParsedStatementReviewResponse> => {
    if (!isPdfStatementParsingEnabled()) {
      throw new Error('PDF statement parsing is disabled for this build.');
    }
    return backendApi.getParsedStatementReview(documentId);
  },

  approveReview: async (documentId: string): Promise<ParsedStatementReviewActionResponse> => {
    if (!isPdfStatementParsingEnabled()) {
      throw new Error('PDF statement parsing is disabled for this build.');
    }
    return backendApi.approveParsedStatementReview(documentId);
  },

  ignoreReview: async (documentId: string): Promise<ParsedStatementReviewActionResponse> => {
    if (!isPdfStatementParsingEnabled()) {
      throw new Error('PDF statement parsing is disabled for this build.');
    }
    return backendApi.ignoreParsedStatementReview(documentId);
  },

  importReview: async (documentId: string, payload: ParsedStatementImportRequest): Promise<ParsedStatementReviewActionResponse> => {
    if (!isPdfStatementParsingEnabled()) {
      throw new Error('PDF statement parsing is disabled for this build.');
    }
    return backendApi.importParsedStatementReview(documentId, payload);
  },

  listPasswordProfiles: async (): Promise<PdfPasswordProfile[]> => {
    if (!isPdfStatementParsingEnabled()) {
      return [];
    }
    const response = await backendApi.listPdfPasswordProfiles();
    return response.items;
  },

  deletePasswordProfile: async (profileId: string): Promise<void> => {
    if (!isPdfStatementParsingEnabled()) {
      throw new Error('PDF statement parsing is disabled for this build.');
    }
    await backendApi.deletePdfPasswordProfile(profileId);
  },
};
