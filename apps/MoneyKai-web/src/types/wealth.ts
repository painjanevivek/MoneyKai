import type { PortfolioAssetType, PortfolioHolding, WealthSnapshot } from './portfolio';

export type { WealthSnapshot } from './portfolio';

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
