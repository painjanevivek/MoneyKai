import { isWealthTabEnabled } from '@/config/environment';
import { backendApi } from './backendApi';
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

export const portfolioApi = {
  getState: async (): Promise<PortfolioStateResponse> => {
    if (!isWealthTabEnabled()) {
      return disabledState();
    }
    return backendApi.getPortfolioState();
  },

  listConnections: async (): Promise<PortfolioAccount[]> => {
    if (!isWealthTabEnabled()) {
      return [];
    }

    const response = await backendApi.listPortfolioConnections();
    return response.items;
  },

  createConnectionMetadata: async (payload: ProviderConnectionDraft): Promise<PortfolioAccount> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }

    const response = await backendApi.createPortfolioConnection(payload);
    return response.item;
  },

  updateConnection: async (accountId: string, payload: ProviderConnectionUpdate): Promise<PortfolioAccount> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    const response = await backendApi.updatePortfolioConnection(accountId, payload);
    return response.item;
  },

  pauseConnection: async (accountId: string): Promise<PortfolioAccount> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    const response = await backendApi.pausePortfolioConnection(accountId);
    return response.item;
  },

  disconnectConnection: async (accountId: string): Promise<PortfolioAccount> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    const response = await backendApi.disconnectPortfolioConnection(accountId);
    return response.item;
  },

  syncConnection: async (accountId: string): Promise<ProviderSyncResponse> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    return backendApi.syncPortfolioConnection(accountId);
  },

  createHolding: async (payload: PortfolioHoldingDraft): Promise<PortfolioHolding> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    const response = await backendApi.createPortfolioHolding(payload);
    return response.item;
  },

  updateHolding: async (holdingId: string, payload: PortfolioHoldingUpdate): Promise<PortfolioHolding> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    const response = await backendApi.updatePortfolioHolding(holdingId, payload);
    return response.item;
  },

  deleteHolding: async (holdingId: string): Promise<void> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    await backendApi.deletePortfolioHolding(holdingId);
  },

  createSnapshot: async (): Promise<WealthSnapshot> => {
    if (!isWealthTabEnabled()) {
      return disabledState().snapshot;
    }
    return backendApi.createWealthSnapshot();
  },

  importParsedDocumentHoldings: async (documentId: string): Promise<{ items: PortfolioHolding[]; importedCount: number }> => {
    if (!isWealthTabEnabled()) {
      throw new Error('Wealth monitoring is disabled for this build.');
    }
    return backendApi.importParsedDocumentHoldings(documentId);
  },

  startZerodhaConnect: async (): Promise<ZerodhaConnectStartResponse> => {
    if (!isWealthTabEnabled()) {
      return { enabled: false, authorizationUrl: null, state: null, expiresAt: null, message: 'Wealth monitoring is disabled for this build.' };
    }
    return backendApi.startZerodhaConnect();
  },

  completeZerodhaConnect: async (payload: ZerodhaConnectCallbackRequest): Promise<ZerodhaConnectCallbackResponse> => {
    if (!isWealthTabEnabled()) {
      return { enabled: false, account: null, message: 'Wealth monitoring is disabled for this build.' };
    }
    return backendApi.completeZerodhaConnect(payload);
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
    return backendApi.getAccountAggregatorExploration();
  },
};
