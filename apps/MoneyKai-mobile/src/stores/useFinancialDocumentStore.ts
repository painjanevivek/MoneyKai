import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPdfStatementParsingEnabled } from '@/config/environment';
import type {
  FinancialDocument,
  FinancialDocumentStatusSummary,
  ParsedStatementReview,
  PdfPasswordProfile,
} from '@/types/financialDocument';

interface FinancialDocumentState {
  documents: FinancialDocument[];
  reviewsByDocumentId: Record<string, ParsedStatementReview>;
  passwordProfiles: PdfPasswordProfile[];
  parsingConsentAcceptedAt?: string;
  status: FinancialDocumentStatusSummary;
  acceptParsingConsent: () => void;
  setStatus: (status: FinancialDocumentStatusSummary) => void;
  setDocuments: (documents: FinancialDocument[]) => void;
  addOrUpdateDocument: (document: FinancialDocument) => void;
  setReview: (review: ParsedStatementReview) => void;
  removeDocument: (documentId: string) => void;
  setPasswordProfiles: (profiles: PdfPasswordProfile[]) => void;
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

      removeDocument: (documentId) =>
        set((state) => {
          const documents = state.documents.filter((document) => document.id !== documentId);
          return { documents, status: buildStatus(documents) };
        }),

      setPasswordProfiles: (passwordProfiles) => set({ passwordProfiles }),

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
