import { isGmailSyncEnabled } from '@/config/environment';
import { backendApi } from './backendApi';
import type {
  FinancialEmailRecord,
  GmailConnectStartResponse,
  GmailSyncRequest,
  GmailSyncStatus,
  GmailSyncSummary,
} from '@/types/gmail';

export const gmailSyncApi = {
  startConnect: async (metadataScanAcceptedAt: string): Promise<GmailConnectStartResponse> => {
    if (!isGmailSyncEnabled()) {
      throw new Error('Gmail sync is disabled for this build.');
    }
    return backendApi.startGmailConnect(metadataScanAcceptedAt);
  },

  getStatus: async (): Promise<GmailSyncStatus> => {
    if (!isGmailSyncEnabled()) {
      return {
        enabled: false,
        financialEmailCount: 0,
        parsedAttachmentCount: 0,
        needsPasswordCount: 0,
        importedItemCount: 0,
      };
    }

    return backendApi.getGmailStatus();
  },

  disconnect: async (): Promise<void> => {
    if (!isGmailSyncEnabled()) {
      return;
    }
    await backendApi.disconnectGmail();
  },

  syncMetadata: async (payload: GmailSyncRequest): Promise<GmailSyncSummary> => {
    if (!isGmailSyncEnabled()) {
      throw new Error('Gmail sync is disabled for this build.');
    }
    return backendApi.syncGmail(payload);
  },

  listEmails: async (parseStatus?: string): Promise<FinancialEmailRecord[]> => {
    if (!isGmailSyncEnabled()) {
      return [];
    }
    const response = await backendApi.listGmailEmails(parseStatus);
    return response.items;
  },
};
