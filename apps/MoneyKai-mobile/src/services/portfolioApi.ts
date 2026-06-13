import { isWealthTabEnabled } from '@/config/environment';
import { backendApi } from './backendApi';
import type { PortfolioAccount, ProviderConnectionDraft } from '@/types/portfolio';

export const portfolioApi = {
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
};
