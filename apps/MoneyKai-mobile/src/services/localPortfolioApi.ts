import { usePortfolioStore } from '@/stores/usePortfolioStore';
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
  ZerodhaConnectCallbackResponse,
  ZerodhaConnectStartResponse,
} from '@/types/portfolio';
import { buildWealthOverview } from '@/utils/wealthAnalytics';

const LOCAL_USER_ID = 'local';
const LOCAL_MANUAL_ACCOUNT_ID = 'local-manual-portfolio';

const nowIso = (): string => new Date().toISOString();

const makeId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const buildSnapshot = (accounts: PortfolioAccount[], holdings: PortfolioHolding[]): WealthSnapshot =>
  buildWealthOverview(LOCAL_USER_ID, accounts, holdings).snapshot;

const getLocalState = (): PortfolioStateResponse => {
  const state = usePortfolioStore.getState();
  const snapshot = state.snapshot ?? buildSnapshot(state.accounts, state.holdings);
  return {
    enabled: true,
    accounts: state.accounts,
    holdings: state.holdings,
    transactions: state.transactions,
    snapshot,
  };
};

const persistLocalState = (partial: Partial<Pick<PortfolioStateResponse, 'accounts' | 'holdings' | 'transactions'>>) => {
  const current = usePortfolioStore.getState();
  const accounts = partial.accounts ?? current.accounts;
  const holdings = partial.holdings ?? current.holdings;
  const transactions = partial.transactions ?? current.transactions;
  usePortfolioStore.getState().setPortfolioState({
    enabled: true,
    accounts,
    holdings,
    transactions,
    snapshot: buildSnapshot(accounts, holdings),
  });
};

const ensureManualAccount = (accountId?: string): PortfolioAccount => {
  const state = usePortfolioStore.getState();
  const existing = accountId
    ? state.accounts.find((account) => account.id === accountId)
    : state.accounts.find((account) => account.provider === 'manual' && account.accountType === 'manual');
  if (existing) {
    return existing;
  }

  const createdAt = nowIso();
  const account: PortfolioAccount = {
    id: accountId ?? LOCAL_MANUAL_ACCOUNT_ID,
    userId: LOCAL_USER_ID,
    provider: 'manual',
    accountType: 'manual',
    displayName: 'Manual portfolio',
    status: 'connected',
    createdAt,
    lastSyncedAt: createdAt,
  };
  persistLocalState({ accounts: [account, ...state.accounts] });
  return account;
};

const normalizeHolding = (
  payload: PortfolioHoldingDraft | (PortfolioHolding & PortfolioHoldingUpdate),
  accountId: string,
  holdingId = makeId('local-holding'),
): PortfolioHolding => {
  const quantity = Number(payload.quantity ?? 1);
  const currentValue = Number(payload.currentValue ?? 0);
  const averagePrice = payload.averagePrice === undefined ? undefined : Number(payload.averagePrice);
  const investedValue = Number(payload.investedValue ?? (averagePrice !== undefined ? averagePrice * quantity : currentValue));
  const totalPnl = currentValue - investedValue;
  const totalPnlPercent = investedValue > 0 ? (totalPnl / investedValue) * 100 : 0;

  return {
    id: holdingId,
    userId: LOCAL_USER_ID,
    accountId,
    assetType: payload.assetType ?? 'other',
    symbol: payload.symbol,
    isin: payload.isin,
    name: payload.name,
    quantity,
    averagePrice,
    lastPrice: payload.lastPrice,
    investedValue,
    currentValue,
    dayChange: payload.dayChange,
    totalPnl,
    totalPnlPercent,
    currency: 'INR',
    asOfDate: payload.asOfDate ?? nowIso().slice(0, 10),
    source: payload.source ?? 'manual_local',
  };
};

export const localPortfolioApi = {
  getState: async (): Promise<PortfolioStateResponse> => getLocalState(),

  listConnections: async (): Promise<PortfolioAccount[]> => getLocalState().accounts,

  createConnectionMetadata: async (payload: ProviderConnectionDraft): Promise<PortfolioAccount> => {
    const state = usePortfolioStore.getState();
    const existingManual = payload.provider === 'manual'
      ? state.accounts.find((account) => account.provider === 'manual' && account.accountType === 'manual')
      : undefined;
    if (existingManual) {
      return existingManual;
    }

    const account: PortfolioAccount = {
      id: makeId('local-account'),
      userId: LOCAL_USER_ID,
      provider: payload.provider,
      accountType: payload.accountType,
      displayName: payload.displayName,
      maskedAccountId: payload.maskedAccountId,
      status: 'connected',
      createdAt: nowIso(),
    };
    persistLocalState({ accounts: [account, ...state.accounts] });
    return account;
  },

  updateConnection: async (accountId: string, payload: ProviderConnectionUpdate): Promise<PortfolioAccount> => {
    const state = usePortfolioStore.getState();
    const existing = state.accounts.find((account) => account.id === accountId);
    if (!existing) {
      throw new Error('Portfolio account was not found locally.');
    }
    const account = { ...existing, ...payload };
    persistLocalState({ accounts: state.accounts.map((item) => (item.id === accountId ? account : item)) });
    return account;
  },

  pauseConnection: async (accountId: string): Promise<PortfolioAccount> =>
    localPortfolioApi.updateConnection(accountId, { status: 'paused' }),

  disconnectConnection: async (accountId: string): Promise<PortfolioAccount> =>
    localPortfolioApi.updateConnection(accountId, { status: 'disconnected' }),

  syncConnection: async (accountId: string): Promise<ProviderSyncResponse> => {
    const state = usePortfolioStore.getState();
    const account = state.accounts.find((item) => item.id === accountId) ?? ensureManualAccount(accountId);
    const syncedAccount = { ...account, lastSyncedAt: nowIso() };
    const accounts = state.accounts.map((item) => (item.id === syncedAccount.id ? syncedAccount : item));
    const holdings = state.holdings.filter((holding) => holding.accountId === syncedAccount.id);
    const snapshot = buildSnapshot(accounts, state.holdings);
    persistLocalState({ accounts });
    return {
      account: syncedAccount,
      holdings,
      transactions: state.transactions.filter((transaction) => transaction.accountId === syncedAccount.id),
      snapshot,
      message: 'Manual account snapshot refreshed locally.',
    };
  },

  createHolding: async (payload: PortfolioHoldingDraft): Promise<PortfolioHolding> => {
    const account = ensureManualAccount(payload.accountId);
    const state = usePortfolioStore.getState();
    const holding = normalizeHolding(payload, account.id);
    persistLocalState({ holdings: [holding, ...state.holdings.filter((item) => item.id !== holding.id)] });
    return holding;
  },

  updateHolding: async (holdingId: string, payload: PortfolioHoldingUpdate): Promise<PortfolioHolding> => {
    const state = usePortfolioStore.getState();
    const existing = state.holdings.find((holding) => holding.id === holdingId);
    if (!existing) {
      throw new Error('Portfolio holding was not found locally.');
    }
    const holding = normalizeHolding({ ...existing, ...payload }, existing.accountId, holdingId);
    persistLocalState({ holdings: state.holdings.map((item) => (item.id === holdingId ? holding : item)) });
    return holding;
  },

  deleteHolding: async (holdingId: string): Promise<void> => {
    const state = usePortfolioStore.getState();
    persistLocalState({ holdings: state.holdings.filter((holding) => holding.id !== holdingId) });
  },

  createSnapshot: async (): Promise<WealthSnapshot> => {
    const state = usePortfolioStore.getState();
    const snapshot = buildSnapshot(state.accounts, state.holdings);
    usePortfolioStore.getState().setSnapshot(snapshot);
    return snapshot;
  },

  importParsedDocumentHoldings: async (): Promise<{ items: PortfolioHolding[]; importedCount: number }> => ({
    items: [],
    importedCount: 0,
  }),

  startZerodhaConnect: async (): Promise<ZerodhaConnectStartResponse> => ({
    enabled: false,
    authorizationUrl: null,
    state: null,
    expiresAt: null,
    message: 'Zerodha requires backend provider credentials before it can be connected.',
  }),

  completeZerodhaConnect: async (): Promise<ZerodhaConnectCallbackResponse> => ({
    enabled: false,
    account: null,
    message: 'Zerodha requires backend provider credentials before it can be connected.',
  }),

  getAccountAggregatorExploration: async (): Promise<AccountAggregatorExplorationStatus> => ({
    providerKey: 'account_aggregator',
    productionReady: false,
    buildVsPartnerDecision: 'partner_required',
    partnerName: null,
    partnerUrl: null,
    checklist: ['Choose an Account Aggregator partner and complete FIU onboarding before enabling production sync.'],
  }),
};
