import { isGmailSyncEnabled } from '@/config/environment';
import { backendApi } from './backendApi';
import type {
  FinancialEmailRecord,
  GmailConnectStartResponse,
  GmailSyncRequest,
  GmailSyncStatus,
  GmailSyncSummary,
} from '@/types/gmail';

const GMAIL_RESTRICTED_SCOPES = [
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.readonly',
];

const GMAIL_SETUP_ITEMS = [
  'Create a Google Cloud OAuth client for MoneyKai web and mobile redirect URLs.',
  'Configure backend GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and encrypted token storage.',
  'Submit OAuth consent screen verification for Gmail restricted scopes before public launch.',
  'Deploy Gmail status, connect, callback, sync, email list, disconnect, and attachment queue backend routes.',
];

const disabledGmailStatus = (message = 'Gmail sync needs Google OAuth restricted-scope review and backend routes before it can run.'): GmailSyncStatus => ({
  enabled: false,
  connection: null,
  financialEmailCount: 0,
  parsedAttachmentCount: 0,
  needsPasswordCount: 0,
  importedItemCount: 0,
  lastSyncError: message,
  message,
  checklist: GMAIL_SETUP_ITEMS,
  manualSetupRequired: GMAIL_SETUP_ITEMS,
  restrictedScopes: GMAIL_RESTRICTED_SCOPES,
});

const disabledGmailConnect = (): GmailConnectStartResponse => ({
  enabled: false,
  authorizationUrl: null,
  state: null,
  expiresAt: null,
  message: 'Gmail OAuth is not configured yet. Complete the Google Cloud and backend setup checklist first.',
  checklist: GMAIL_SETUP_ITEMS,
  manualSetupRequired: GMAIL_SETUP_ITEMS,
});

const shouldUseSetupStatus = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('backend api is not configured') ||
    message.includes('not configured') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    message.includes('404') ||
    message.includes('not found')
  );
};

export const gmailSyncApi = {
  startConnect: async (metadataScanAcceptedAt: string, returnTo?: string): Promise<GmailConnectStartResponse> => {
    if (!isGmailSyncEnabled()) {
      throw new Error('Gmail sync is disabled for this build.');
    }
    try {
      return await backendApi.startGmailConnect(metadataScanAcceptedAt, returnTo);
    } catch (error) {
      if (shouldUseSetupStatus(error)) {
        return disabledGmailConnect();
      }
      throw error;
    }
  },

  getStatus: async (): Promise<GmailSyncStatus> => {
    if (!isGmailSyncEnabled()) {
      return disabledGmailStatus('Gmail sync is disabled for this build.');
    }

    try {
      return await backendApi.getGmailStatus();
    } catch (error) {
      if (shouldUseSetupStatus(error)) {
        return disabledGmailStatus();
      }
      throw error;
    }
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
