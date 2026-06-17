import { isWealthTabEnabled } from '@/config/environment';
import { backendApi } from './backendApi';
import { localPortfolioApi } from './localPortfolioApi';
import type {
  AccountAggregatorExplorationStatus,
  PortfolioAccount,
  PortfolioHolding,
  PortfolioHoldingDraft,
  PortfolioHoldingUpdate,
  PortfolioStateResponse,
  ProviderConnectionDraft,
  ProviderConnectionUpdate,
  ProviderSyncResponse,
  WealthSnapshot,
  ZerodhaConnectCallbackRequest,
  ZerodhaConnectCallbackResponse,
  ZerodhaConnectStartResponse,
} from '@/types/portfolio';

const disabledState = (): PortfolioStateResponse => ({
  enabled: false,
  accounts: [],
  holdings: [],
  transactions: [],
  snapshot: {
    id: 'disabled',
    userId: 'local',
    date: new Date().toISOString(),
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    totalInvested: 0,
    currentPortfolioValue: 0,
    totalPnl: 0,
    cashBalance: 0,
    sourceAccountCount: 0,
  },
});

const shouldUseLocalFallback = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    message.includes('backend api is not configured') ||
    message.includes('not configured') ||
    message.includes('you need to be signed in') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    message.includes('404') ||
    message.includes('not found')
  );
};

const remoteOrLocal = async <T>(remote: () => Promise<T>, local: () => Promise<T>): Promise<T> => {
  try {
    return await remote();
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      return local();
    }
    throw error;
  }
};

const isLocalZerodhaPayload = (payload: ZerodhaConnectCallbackRequest): boolean =>
  payload.state.startsWith('local-zerodha-sandbox');

export const portfolioApi = {
  getState: async (): Promise<PortfolioStateResponse> => {
    if (!isWealthTabEnabled()) {
      return disabledState();
    }
    return remoteOrLocal(() => backendApi.getPortfolioState(), () => localPortfolioApi.getState());
  },

  listConnections: async (): Promise<PortfolioAccount[]> => {
    if (!isWealthTabEnabled()) {
      return [];
    }

    const response = await remoteOrLocal(
      () => backendApi.listPortfolioConnections(),
      async () => ({ items: await localPortfolioApi.listConnections() })
    );
    return response.items;
  },

  createConnectionMetadata: async (payload: ProviderConnectionDraft): Promise<PortfolioAccount> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }

    return remoteOrLocal(
      async () => (await backendApi.createPortfolioConnection(payload)).item,
      () => localPortfolioApi.createConnectionMetadata(payload)
    );
  },

  updateConnection: async (accountId: string, payload: ProviderConnectionUpdate): Promise<PortfolioAccount> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    return remoteOrLocal(
      async () => (await backendApi.updatePortfolioConnection(accountId, payload)).item,
      () => localPortfolioApi.updateConnection(accountId, payload)
    );
  },

  pauseConnection: async (accountId: string): Promise<PortfolioAccount> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    return remoteOrLocal(
      async () => (await backendApi.pausePortfolioConnection(accountId)).item,
      () => localPortfolioApi.pauseConnection(accountId)
    );
  },

  disconnectConnection: async (accountId: string): Promise<PortfolioAccount> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    return remoteOrLocal(
      async () => (await backendApi.disconnectPortfolioConnection(accountId)).item,
      () => localPortfolioApi.disconnectConnection(accountId)
    );
  },

  syncConnection: async (accountId: string): Promise<ProviderSyncResponse> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    return remoteOrLocal(
      () => backendApi.syncPortfolioConnection(accountId),
      () => localPortfolioApi.syncConnection(accountId)
    );
  },

  createHolding: async (payload: PortfolioHoldingDraft): Promise<PortfolioHolding> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    return remoteOrLocal(
      async () => (await backendApi.createPortfolioHolding(payload)).item,
      () => localPortfolioApi.createHolding(payload)
    );
  },

  updateHolding: async (holdingId: string, payload: PortfolioHoldingUpdate): Promise<PortfolioHolding> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    return remoteOrLocal(
      async () => (await backendApi.updatePortfolioHolding(holdingId, payload)).item,
      () => localPortfolioApi.updateHolding(holdingId, payload)
    );
  },

  deleteHolding: async (holdingId: string): Promise<void> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    await remoteOrLocal(
      async () => {
        await backendApi.deletePortfolioHolding(holdingId);
      },
      () => localPortfolioApi.deleteHolding(holdingId)
    );
  },

  createSnapshot: async (): Promise<WealthSnapshot> => {
    if (!isWealthTabEnabled()) {
      return disabledState().snapshot;
    }
    return remoteOrLocal(() => backendApi.createWealthSnapshot(), () => localPortfolioApi.createSnapshot());
  },

  importParsedDocumentHoldings: async (documentId: string): Promise<{ items: PortfolioHolding[]; importedCount: number }> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    return remoteOrLocal(
      () => backendApi.importParsedDocumentHoldings(documentId),
      () => localPortfolioApi.importParsedDocumentHoldings()
    );
  },

  startZerodhaConnect: async (): Promise<ZerodhaConnectStartResponse> => {
    if (!isWealthTabEnabled()) {
      return { enabled: false, authorizationUrl: null, state: null, expiresAt: null, message: 'Wealth monitoring is disabled for this build.' };
    }
    const response = await remoteOrLocal(() => backendApi.startZerodhaConnect(), () => localPortfolioApi.startZerodhaConnect());
    return response.enabled ? response : localPortfolioApi.startZerodhaConnect();
  },

  completeZerodhaConnect: async (payload: ZerodhaConnectCallbackRequest): Promise<ZerodhaConnectCallbackResponse> => {
    if (!isWealthTabEnabled()) {
      return { enabled: false, account: null, message: 'Wealth monitoring is disabled for this build.' };
    }
    if (isLocalZerodhaPayload(payload)) {
      return localPortfolioApi.completeZerodhaConnect(payload);
    }
    const response = await remoteOrLocal(
      () => backendApi.completeZerodhaConnect(payload),
      () => localPortfolioApi.completeZerodhaConnect(payload)
    );
    return response.enabled ? response : localPortfolioApi.completeZerodhaConnect(payload);
  },

  getAccountAggregatorExploration: async (): Promise<AccountAggregatorExplorationStatus> => {
    if (!isWealthTabEnabled()) {
      return {
        providerKey: 'account_aggregator',
        productionReady: false,
        buildVsPartnerDecision: 'partner_required',
        partnerName: null,
        partnerUrl: null,
        checklist: ['Enable the wealth feature flag before exploring Account Aggregator integrations.'],
      };
    }
    return remoteOrLocal(
      () => backendApi.getAccountAggregatorExploration(),
      () => localPortfolioApi.getAccountAggregatorExploration()
    );
  },

  ensureAccountAggregatorReadinessAccount: async (): Promise<PortfolioAccount> =>
    localPortfolioApi.ensureAccountAggregatorReadinessAccount(),
};
