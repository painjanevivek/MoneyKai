export type PortfolioProvider =
  | 'zerodha'
  | 'upstox'
  | 'angel_one'
  | 'account_aggregator'
  | 'gmail_statement'
  | 'manual';

export type PortfolioAccountType = 'broker' | 'mutual_fund' | 'bank' | 'loan' | 'insurance' | 'manual';

export type PortfolioAssetType =
  | 'equity'
  | 'mutual_fund'
  | 'etf'
  | 'fd'
  | 'gold'
  | 'crypto'
  | 'cash'
  | 'bond'
  | 'insurance'
  | 'loan'
  | 'credit_card'
  | 'other';

export interface PortfolioAccount {
  id: string;
  userId: string;
  provider: PortfolioProvider;
  accountType: PortfolioAccountType;
  displayName: string;
  maskedAccountId?: string;
  status: 'connected' | 'needs_reauth' | 'paused' | 'error' | 'disconnected';
  lastSyncedAt?: string;
  createdAt: string;
}

export interface WealthSnapshot {
  id: string;
  userId: string;
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  totalInvested: number;
  currentPortfolioValue: number;
  totalPnl: number;
  cashBalance?: number;
  sourceAccountCount: number;
}

export interface PortfolioHolding {
  id: string;
  userId: string;
  accountId: string;
  assetType: PortfolioAssetType;
  symbol?: string;
  isin?: string;
  name: string;
  quantity: number;
  averagePrice?: number;
  lastPrice?: number;
  investedValue: number;
  currentValue: number;
  dayChange?: number;
  totalPnl?: number;
  totalPnlPercent?: number;
  currency: 'INR';
  asOfDate: string;
  source: string;
}

export interface PortfolioTransaction {
  id: string;
  userId: string;
  accountId: string;
  assetType: PortfolioAssetType;
  symbol?: string;
  isin?: string;
  name: string;
  action:
    | 'buy'
    | 'sell'
    | 'sip'
    | 'dividend'
    | 'interest'
    | 'redemption'
    | 'fee'
    | 'tax'
    | 'split'
    | 'bonus'
    | 'unknown';
  quantity?: number;
  price?: number;
  amount: number;
  transactionDate: string;
  sourceDocumentId?: string;
  providerReference?: string;
}

export interface ProviderConnectionDraft {
  provider: PortfolioProvider;
  accountType: PortfolioAccountType;
  displayName: string;
  maskedAccountId?: string;
}

export interface ProviderConnectionUpdate {
  displayName?: string;
  maskedAccountId?: string;
  status?: PortfolioAccount['status'];
}

export interface PortfolioHoldingDraft {
  accountId?: string;
  assetType: PortfolioAssetType;
  symbol?: string;
  isin?: string;
  name: string;
  quantity: number;
  averagePrice?: number;
  lastPrice?: number;
  investedValue?: number;
  currentValue: number;
  dayChange?: number;
  asOfDate?: string;
  source?: string;
  sourceDocumentId?: string;
}

export type PortfolioHoldingUpdate = Partial<Omit<PortfolioHoldingDraft, 'accountId' | 'source' | 'sourceDocumentId'>>;

export interface PortfolioStateResponse {
  enabled: boolean;
  accounts: PortfolioAccount[];
  holdings: PortfolioHolding[];
  transactions: PortfolioTransaction[];
  snapshot: WealthSnapshot;
}

export interface ProviderSyncResponse {
  account: PortfolioAccount;
  holdings: PortfolioHolding[];
  transactions: PortfolioTransaction[];
  snapshot: WealthSnapshot;
  message: string;
}

export interface ZerodhaConnectStartResponse {
  enabled: boolean;
  authorizationUrl?: string | null;
  state?: string | null;
  expiresAt?: string | null;
  message: string;
}

export interface ZerodhaConnectCallbackRequest {
  requestToken: string;
  state: string;
}

export interface ZerodhaConnectCallbackResponse {
  enabled: boolean;
  account?: PortfolioAccount | null;
  message: string;
}

export interface AccountAggregatorExplorationStatus {
  providerKey: 'account_aggregator';
  productionReady: boolean;
  buildVsPartnerDecision: 'partner_required' | 'build_after_fiu_onboarding';
  partnerName?: string | null;
  partnerUrl?: string | null;
  decisionLockedAt?: string | null;
  checklist: string[];
}
