import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPdfStatementParsingEnabled } from '@/config/environment';
import type { AiDocumentSummaryResponse } from '@/features/ai/types';
import type {
  FinancialDocument,
  FinancialDocumentStatusSummary,
  ParsedStatementReview,
  PdfPasswordProfile,
} from '@/types/financialDocument';

interface FinancialDocumentState {
  documents: FinancialDocument[];
  reviewsByDocumentId: Record<string, ParsedStatementReview>;
  aiSummariesByDocumentId: Record<string, AiDocumentSummaryResponse>;
  passwordProfiles: PdfPasswordProfile[];
  parsingConsentAcceptedAt?: string;
  status: FinancialDocumentStatusSummary;
  acceptParsingConsent: () => void;
  setStatus: (status: FinancialDocumentStatusSummary) => void;
  setDocuments: (documents: FinancialDocument[]) => void;
  addOrUpdateDocument: (document: FinancialDocument) => void;
  setReview: (review: ParsedStatementReview) => void;
  setAiSummary: (documentId: string, summary: AiDocumentSummaryResponse) => void;
  removeDocument: (documentId: string) => void;
  setPasswordProfiles: (profiles: PdfPasswordProfile[]) => void;
  removePasswordProfile: (profileId: string) => void;
  canParseDocuments: () => boolean;
}

const buildStatus = (documents: FinancialDocument[]): FinancialDocumentStatusSummary => ({
  enabled: isPdfStatementParsingEnabled(),
  queuedCount: documents.filter((document) => document.status === 'queued' || document.status === 'parsing').length,
  needsPasswordCount: documents.filter((document) => document.status === 'needs_password').length,
  reviewRequiredCount: documents.filter((document) => document.status === 'review_required').length,
  importedCount: documents.filter((document) => document.status === 'imported').length,
});

export const useFinancialDocumentStore = create<FinancialDocumentState>()(
  persist(
    (set, get) => ({
      documents: [],
      reviewsByDocumentId: {},
      aiSummariesByDocumentId: {},
      passwordProfiles: [],
      status: buildStatus([]),

      acceptParsingConsent: () => set({ parsingConsentAcceptedAt: new Date().toISOString() }),

      setStatus: (status) => set({ status }),

      setDocuments: (documents) => set({ documents, status: buildStatus(documents) }),

      addOrUpdateDocument: (document) =>
        set((state) => {
          const documents = [
            document,
            ...state.documents.filter((existing) => existing.id !== document.id),
          ];
          return { documents, status: buildStatus(documents) };
        }),

      setReview: (review) =>
        set((state) => ({
          reviewsByDocumentId: {
            ...state.reviewsByDocumentId,
            [review.documentId]: review,
          },
        })),

      setAiSummary: (documentId, summary) =>
        set((state) => ({
          aiSummariesByDocumentId: {
            ...state.aiSummariesByDocumentId,
            [documentId]: summary,
          },
        })),

      removeDocument: (documentId) =>
        set((state) => {
          const documents = state.documents.filter((document) => document.id !== documentId);
          const { [documentId]: _removedReview, ...reviewsByDocumentId } = state.reviewsByDocumentId;
          const { [documentId]: _removedSummary, ...aiSummariesByDocumentId } = state.aiSummariesByDocumentId;
          return { documents, reviewsByDocumentId, aiSummariesByDocumentId, status: buildStatus(documents) };
        }),

      setPasswordProfiles: (passwordProfiles) => set({ passwordProfiles }),

      removePasswordProfile: (profileId) =>
        set((state) => ({
          passwordProfiles: state.passwordProfiles.filter((profile) => profile.id !== profileId),
        })),

      canParseDocuments: () =>
        isPdfStatementParsingEnabled() && Boolean(get().parsingConsentAcceptedAt),
    }),
    {
      name: 'moneykai-financial-documents',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        documents: state.documents,
        reviewsByDocumentId: state.reviewsByDocumentId,
        passwordProfiles: state.passwordProfiles,
        parsingConsentAcceptedAt: state.parsingConsentAcceptedAt,
      }),
    }
  )
);
