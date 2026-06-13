import type { PortfolioAssetType, PortfolioHolding } from './portfolio';

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

export interface AssetAllocationSlice {
  assetType: PortfolioAssetType;
  label: string;
  value: number;
  percent: number;
  color: string;
}

export interface WealthInsight {
  id: string;
  tone: 'info' | 'success' | 'warning';
  title: string;
  body: string;
  createdAt: string;
}

export interface WealthOverview {
  snapshot: WealthSnapshot;
  allocation: AssetAllocationSlice[];
  topHoldings: PortfolioHolding[];
  insights: WealthInsight[];
}
