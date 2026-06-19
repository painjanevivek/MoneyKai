import { backendApi } from './backendApi';
import type {
  LinkedAccountConnectStartResponse,
  LinkedAccountProviderStatus,
  LinkedAccountSyncResponse,
} from '@/types/linkedAccountProvider';

const providerRequiredStatus = (message?: string): LinkedAccountProviderStatus => ({
  enabled: false,
  provider: 'account_aggregator',
  productionReady: false,
  sandboxEnabled: false,
  message:
    message ||
    'Live bank linking is waiting for a configured provider backend. Manual accounts remain available.',
  checklist: [
    'Choose a regulated account-data provider for your launch market.',
    'Complete provider onboarding, consent copy, redirect URLs, and webhook verification.',
    'Store provider credentials only on the backend.',
    'Map provider accounts and transactions into MoneyKai review drafts before import.',
  ],
  manualSetupRequired: [
    'Provider credentials',
    'OAuth or consent redirect endpoint',
    'Webhook signature verification',
    'Transaction de-duplication and review queue',
  ],
});

const shouldUseProviderFallback = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('backend api is not configured') ||
    message.includes('not configured') ||
    message.includes('you need to be signed in') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    message.includes('not found')
  );
};

export const linkedAccountProviderApi = {
  getStatus: async (): Promise<LinkedAccountProviderStatus> => {
    try {
      return await backendApi.getLinkedAccountProviderStatus();
    } catch (error) {
      if (shouldUseProviderFallback(error)) {
        return providerRequiredStatus(error instanceof Error ? error.message : undefined);
      }
      throw error;
    }
  },

  startConnection: async (): Promise<LinkedAccountConnectStartResponse> =>
    backendApi.startLinkedAccountConnection(),

  syncAccount: async (accountId: string): Promise<LinkedAccountSyncResponse> =>
    backendApi.syncLinkedAccount(accountId),

  syncAll: async (): Promise<LinkedAccountSyncResponse> =>
    backendApi.syncLinkedAccounts(),
};

export { providerRequiredStatus };
