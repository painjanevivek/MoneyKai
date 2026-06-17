import { usePortfolioStore } from '@/stores/usePortfolioStore';
import type {
  AccountAggregatorExplorationStatus,
  PortfolioAccount,
  PortfolioHolding,
  PortfolioHoldingDraft,
  PortfolioHoldingUpdate,
  PortfolioTransaction,
  PortfolioStateResponse,
  ProviderConnectionDraft,
  ProviderConnectionUpdate,
  ProviderSyncResponse,
  WealthSnapshot,
  ZerodhaConnectCallbackRequest,
  ZerodhaConnectCallbackResponse,
  ZerodhaConnectStartResponse,
} from '@/types/portfolio';
import { buildWealthOverview } from '@/utils/wealthAnalytics';

const LOCAL_USER_ID = 'local';
const LOCAL_MANUAL_ACCOUNT_ID = 'local-manual-portfolio';
const LOCAL_ZERODHA_ACCOUNT_ID = 'local-zerodha-sandbox';
const LOCAL_ZERODHA_STATE_PREFIX = 'local-zerodha-sandbox';
const LOCAL_ACCOUNT_AGGREGATOR_ACCOUNT_ID = 'local-account-aggregator-readiness';

const nowIso = (): string => new Date().toISOString();

const dateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

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

const buildZerodhaSandboxHoldings = (accountId: string): PortfolioHolding[] => {
  const asOfDate = nowIso().slice(0, 10);
  return [
    normalizeHolding(
      {
        accountId,
        assetType: 'equity',
        symbol: 'RELIANCE',
        isin: 'INE002A01018',
        name: 'Reliance Industries',
        quantity: 8,
        averagePrice: 2450,
        lastPrice: 2875,
        investedValue: 19600,
        currentValue: 23000,
        dayChange: 180,
        asOfDate,
        source: 'zerodha_local_sandbox',
      },
      accountId,
      `${accountId}-reliance`
    ),
    normalizeHolding(
      {
        accountId,
        assetType: 'equity',
        symbol: 'TCS',
        isin: 'INE467B01029',
        name: 'Tata Consultancy Services',
        quantity: 3,
        averagePrice: 3370,
        lastPrice: 3895,
        investedValue: 10110,
        currentValue: 11685,
        dayChange: -45,
        asOfDate,
        source: 'zerodha_local_sandbox',
      },
      accountId,
      `${accountId}-tcs`
    ),
    normalizeHolding(
      {
        accountId,
        assetType: 'etf',
        symbol: 'NIFTYBEES',
        isin: 'INF204KB14I2',
        name: 'Nippon India ETF Nifty 50 BeES',
        quantity: 40,
        averagePrice: 205,
        lastPrice: 245.3,
        investedValue: 8200,
        currentValue: 9812,
        dayChange: 85,
        asOfDate,
        source: 'zerodha_local_sandbox',
      },
      accountId,
      `${accountId}-niftybees`
    ),
  ];
};

const buildZerodhaSandboxTransactions = (accountId: string): PortfolioTransaction[] => [
  {
    id: `${accountId}-txn-reliance-buy`,
    userId: LOCAL_USER_ID,
    accountId,
    assetType: 'equity',
    symbol: 'RELIANCE',
    isin: 'INE002A01018',
    name: 'Reliance Industries',
    action: 'buy',
    quantity: 8,
    price: 2450,
    amount: 19600,
    transactionDate: dateDaysAgo(52),
    providerReference: 'local-zerodha-sandbox-reliance',
  },
  {
    id: `${accountId}-txn-tcs-buy`,
    userId: LOCAL_USER_ID,
    accountId,
    assetType: 'equity',
    symbol: 'TCS',
    isin: 'INE467B01029',
    name: 'Tata Consultancy Services',
    action: 'buy',
    quantity: 3,
    price: 3370,
    amount: 10110,
    transactionDate: dateDaysAgo(31),
    providerReference: 'local-zerodha-sandbox-tcs',
  },
  {
    id: `${accountId}-txn-niftybees-sip`,
    userId: LOCAL_USER_ID,
    accountId,
    assetType: 'etf',
    symbol: 'NIFTYBEES',
    isin: 'INF204KB14I2',
    name: 'Nippon India ETF Nifty 50 BeES',
    action: 'sip',
    quantity: 40,
    price: 205,
    amount: 8200,
    transactionDate: dateDaysAgo(18),
    providerReference: 'local-zerodha-sandbox-niftybees',
  },
];

const ensureZerodhaSandboxAccount = (): { account: PortfolioAccount; holdings: PortfolioHolding[]; transactions: PortfolioTransaction[] } => {
  const state = usePortfolioStore.getState();
  const syncedAt = nowIso();
  const existing = state.accounts.find((account) => account.id === LOCAL_ZERODHA_ACCOUNT_ID || account.provider === 'zerodha');
  const account: PortfolioAccount = {
    id: existing?.id ?? LOCAL_ZERODHA_ACCOUNT_ID,
    userId: existing?.userId ?? LOCAL_USER_ID,
    provider: 'zerodha',
    accountType: 'broker',
    displayName: existing?.displayName ?? 'Zerodha sandbox portfolio',
    maskedAccountId: existing?.maskedAccountId ?? 'KITE-4242',
    status: 'connected',
    createdAt: existing?.createdAt ?? syncedAt,
    lastSyncedAt: syncedAt,
  };
  const holdings = buildZerodhaSandboxHoldings(account.id);
  const transactions = buildZerodhaSandboxTransactions(account.id);
  persistLocalState({
    accounts: [account, ...state.accounts.filter((item) => item.id !== account.id)],
    holdings: [...holdings, ...state.holdings.filter((holding) => holding.accountId !== account.id)],
    transactions: [...transactions, ...state.transactions.filter((transaction) => transaction.accountId !== account.id)],
  });
  return { account, holdings, transactions };
};

const ensureAccountAggregatorReadinessAccount = (): PortfolioAccount => {
  const state = usePortfolioStore.getState();
  const createdAt = nowIso();
  const existing = state.accounts.find(
    (account) => account.id === LOCAL_ACCOUNT_AGGREGATOR_ACCOUNT_ID || account.provider === 'account_aggregator'
  );
  const account: PortfolioAccount = {
    id: existing?.id ?? LOCAL_ACCOUNT_AGGREGATOR_ACCOUNT_ID,
    userId: existing?.userId ?? LOCAL_USER_ID,
    provider: 'account_aggregator',
    accountType: 'bank',
    displayName: existing?.displayName ?? 'Account Aggregator readiness',
    maskedAccountId: existing?.maskedAccountId ?? 'FIU setup pending',
    status: existing?.status && existing.status !== 'connected' ? existing.status : 'needs_reauth',
    createdAt: existing?.createdAt ?? createdAt,
    lastSyncedAt: existing?.lastSyncedAt,
  };
  persistLocalState({ accounts: [account, ...state.accounts.filter((item) => item.id !== account.id)] });
  return account;
};

const getLocalSyncMessage = (account: PortfolioAccount): string => {
  if (account.provider === 'zerodha') {
    return 'Zerodha sandbox holdings refreshed locally. Add Kite Connect credentials to enable live broker sync.';
  }
  if (account.provider === 'account_aggregator') {
    return 'Account Aggregator readiness refreshed locally. FIU/TSP onboarding is required before live consent sync.';
  }
  if (account.provider === 'manual') {
    return 'Manual account snapshot refreshed locally.';
  }
  return `${account.displayName} refreshed locally.`;
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
    const initialState = usePortfolioStore.getState();
    const existing = initialState.accounts.find((item) => item.id === accountId);
    if (existing?.provider === 'zerodha') {
      const response = ensureZerodhaSandboxAccount();
      const state = usePortfolioStore.getState();
      return {
        ...response,
        snapshot: buildSnapshot(state.accounts, state.holdings),
        message: getLocalSyncMessage(response.account),
      };
    }

    const account = existing ?? ensureManualAccount(accountId);
    const state = usePortfolioStore.getState();
    const syncedAccount = { ...account, lastSyncedAt: nowIso() };
    const accounts = [syncedAccount, ...state.accounts.filter((item) => item.id !== syncedAccount.id)];
    const holdings = state.holdings.filter((holding) => holding.accountId === syncedAccount.id);
    const snapshot = buildSnapshot(accounts, state.holdings);
    persistLocalState({ accounts });
    return {
      account: syncedAccount,
      holdings,
      transactions: state.transactions.filter((transaction) => transaction.accountId === syncedAccount.id),
      snapshot,
      message: getLocalSyncMessage(syncedAccount),
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
    enabled: true,
    authorizationUrl: null,
    state: `${LOCAL_ZERODHA_STATE_PREFIX}-${Date.now().toString(36)}`,
    expiresAt: null,
    mode: 'local_sandbox',
    manualSetupRequired: [
      'Set Zerodha Kite Connect API key and secret on the backend.',
      'Register the MoneyKai callback URL in Kite Connect.',
      'Deploy encrypted token storage before enabling live broker sync.',
    ],
    message: 'Zerodha production credentials are not configured yet, so MoneyKai will use a local sandbox broker account for this workflow.',
  }),

  completeZerodhaConnect: async (_payload?: ZerodhaConnectCallbackRequest): Promise<ZerodhaConnectCallbackResponse> => {
    const { account } = ensureZerodhaSandboxAccount();
    return {
      enabled: true,
      account,
      mode: 'local_sandbox',
      message: 'Connected a local Zerodha sandbox account with sample holdings. Live Zerodha sync will use the same portfolio surface once Kite Connect credentials are configured.',
    };
  },

  getAccountAggregatorExploration: async (): Promise<AccountAggregatorExplorationStatus> => ({
    providerKey: 'account_aggregator',
    productionReady: false,
    buildVsPartnerDecision: 'partner_required',
    partnerName: 'FIU/TSP partner required',
    partnerUrl: null,
    manualSetupRequired: [
      'Choose an Account Aggregator FIU/TSP partner and complete onboarding.',
      'Add client credentials, certificates, redirect URL, and webhook URL to the backend.',
      'Define consent templates and retention windows before collecting financial data.',
    ],
    checklist: [
      'Choose an Account Aggregator FIU/TSP partner and complete onboarding.',
      'Collect client ID, client secret, signing certificate, encryption certificate, redirect URL, and webhook URL.',
      'Map consent templates for bank balances, deposits, securities, loans, and recurring refresh windows.',
      'Keep manual holdings and statement imports available until production consent sync is approved.',
    ],
  }),

  ensureAccountAggregatorReadinessAccount: async (): Promise<PortfolioAccount> => ensureAccountAggregatorReadinessAccount(),
};
