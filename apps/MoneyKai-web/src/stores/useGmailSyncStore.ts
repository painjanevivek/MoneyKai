import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  FinancialEmailCategory,
  FinancialEmailRecord,
  GmailConnection,
  GmailSyncConsent,
  GmailSyncStatus,
  GmailSyncSummary,
} from '@/types/gmail';
import { DEFAULT_GMAIL_ALLOWED_CATEGORIES } from '@/constants/financialEmailRules';
import { isGmailSyncEnabled } from '@/config/environment';

interface GmailSyncState {
  consent: GmailSyncConsent;
  connection?: GmailConnection;
  status: GmailSyncStatus;
  emails: FinancialEmailRecord[];
  lastSyncSummary?: GmailSyncSummary;
  setAllowedCategories: (categories: FinancialEmailCategory[]) => void;
  acceptMetadataScan: () => void;
  acceptAttachmentDownloads: () => void;
  setSyncWindow: (syncWindow: GmailSyncConsent['syncWindow']) => void;
  setStatus: (status: GmailSyncStatus) => void;
  setConnection: (connection?: GmailConnection) => void;
  setEmails: (emails: FinancialEmailRecord[]) => void;
  setLastSyncSummary: (summary?: GmailSyncSummary) => void;
  resetGmailSync: () => void;
  canScanMetadata: () => boolean;
  canDownloadAttachments: () => boolean;
}

const initialConsent: GmailSyncConsent = {
  allowedCategories: DEFAULT_GMAIL_ALLOWED_CATEGORIES,
  syncWindow: '30d',
};

const initialStatus: GmailSyncStatus = {
  enabled: isGmailSyncEnabled(),
  financialEmailCount: 0,
  parsedAttachmentCount: 0,
  needsPasswordCount: 0,
  importedItemCount: 0,
};

export const useGmailSyncStore = create<GmailSyncState>()(
  persist(
    (set, get) => ({
      consent: initialConsent,
      status: initialStatus,
      emails: [],

      setAllowedCategories: (categories) =>
        set((state) => ({
          consent: {
            ...state.consent,
            allowedCategories: categories.filter((category, index) => categories.indexOf(category) === index),
          },
        })),

      acceptMetadataScan: () =>
        set((state) => ({
          consent: {
            ...state.consent,
            metadataScanAcceptedAt: new Date().toISOString(),
          },
        })),

      acceptAttachmentDownloads: () =>
        set((state) => ({
          consent: {
            ...state.consent,
            attachmentDownloadAcceptedAt: new Date().toISOString(),
          },
        })),

      setSyncWindow: (syncWindow) =>
        set((state) => ({
          consent: {
            ...state.consent,
            syncWindow,
          },
        })),

      setStatus: (status) =>
        set({
          status: {
            ...status,
            enabled: isGmailSyncEnabled() && status.enabled,
          },
          connection: status.connection ?? undefined,
        }),

      setConnection: (connection) =>
        set((state) => ({
          connection,
          status: {
            ...state.status,
            enabled: isGmailSyncEnabled(),
            connection,
          },
        })),

      setEmails: (emails) => set({ emails }),

      setLastSyncSummary: (lastSyncSummary) => set({ lastSyncSummary }),

      resetGmailSync: () =>
        set({
          consent: initialConsent,
          connection: undefined,
          status: initialStatus,
          emails: [],
          lastSyncSummary: undefined,
        }),

      canScanMetadata: () =>
        isGmailSyncEnabled() && Boolean(get().consent.metadataScanAcceptedAt) && Boolean(get().connection),

      canDownloadAttachments: () =>
        get().canScanMetadata() && Boolean(get().consent.attachmentDownloadAcceptedAt),
    }),
    {
      name: 'moneykai-gmail-sync',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        consent: state.consent,
        connection: state.connection,
        emails: state.emails,
        lastSyncSummary: state.lastSyncSummary,
      }),
    }
  )
);
