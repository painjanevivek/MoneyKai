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
