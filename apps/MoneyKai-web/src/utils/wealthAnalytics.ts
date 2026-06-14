import type { PortfolioAccount, PortfolioAssetType, PortfolioHolding } from '@/types/portfolio';
import type { AssetAllocationSlice, WealthInsight, WealthOverview, WealthSnapshot } from '@/types/wealth';
import { getHoldingPnlPercent, sumHoldings } from './portfolioMath';

const ASSET_LABELS: Record<PortfolioAssetType, string> = {
  equity: 'Equity',
  mutual_fund: 'Mutual funds',
  etf: 'ETFs',
  fd: 'Fixed deposits',
  gold: 'Gold',
  crypto: 'Crypto',
  cash: 'Cash',
  bond: 'Bonds',
  insurance: 'Insurance',
  loan: 'Loans',
  credit_card: 'Credit cards',
  other: 'Other',
};

const chartColors = [
  '#0F766E',
  '#2563EB',
  '#D97706',
  '#7C3AED',
  '#DC2626',
  '#059669',
  '#475569',
  '#0891B2',
];

export const buildWealthSnapshot = (
  userId: string,
  accounts: PortfolioAccount[],
  holdings: PortfolioHolding[],
  date = new Date().toISOString()
): WealthSnapshot => {
  const totals = sumHoldings(holdings);
  const liabilities = holdings
    .filter((holding) => holding.assetType === 'loan' || holding.assetType === 'credit_card')
    .reduce((sum, holding) => sum + Math.abs(holding.currentValue), 0);
  const assets = Math.max(0, totals.currentValue - liabilities);

  return {
    id: `${userId}-${date.slice(0, 10)}`,
    userId,
    date,
    totalAssets: assets,
    totalLiabilities: liabilities,
    netWorth: assets - liabilities,
    totalInvested: totals.investedValue,
    currentPortfolioValue: totals.currentValue,
    totalPnl: totals.totalPnl,
    cashBalance: holdings.filter((holding) => holding.assetType === 'cash').reduce((sum, holding) => sum + holding.currentValue, 0),
    sourceAccountCount: accounts.length,
  };
};

export const buildAssetAllocation = (holdings: PortfolioHolding[]): AssetAllocationSlice[] => {
  const positiveHoldings = holdings.filter(
    (holding) => holding.currentValue > 0 && holding.assetType !== 'loan' && holding.assetType !== 'credit_card'
  );
  const total = positiveHoldings.reduce((sum, holding) => sum + holding.currentValue, 0);
  if (total <= 0) {
    return [];
  }

  const grouped = positiveHoldings.reduce<Record<string, number>>((acc, holding) => {
    acc[holding.assetType] = (acc[holding.assetType] ?? 0) + holding.currentValue;
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort(([, a], [, b]) => b - a)
    .map(([assetType, value], index) => ({
      assetType: assetType as PortfolioAssetType,
      label: ASSET_LABELS[assetType as PortfolioAssetType] ?? 'Other',
      value,
      percent: (value / total) * 100,
      color: chartColors[index % chartColors.length],
    }));
};

export const buildWealthInsights = (holdings: PortfolioHolding[]): WealthInsight[] => {
  if (holdings.length === 0) {
    return [];
  }

  const now = new Date().toISOString();
  const totalValue = holdings.reduce((sum, holding) => sum + Math.max(holding.currentValue, 0), 0);
  const largest = [...holdings].sort((a, b) => b.currentValue - a.currentValue)[0];
  const insights: WealthInsight[] = [];

  if (largest && totalValue > 0 && largest.currentValue / totalValue > 0.5) {
    insights.push({
      id: 'portfolio-concentration',
      tone: 'warning',
      title: 'Concentration risk',
      body: `${largest.name} is more than half of tracked assets.`,
      createdAt: now,
    });
  }

  const losingHolding = holdings.find((holding) => getHoldingPnlPercent(holding) <= -10);
  if (losingHolding) {
    insights.push({
      id: `drawdown-${losingHolding.id}`,
      tone: 'info',
      title: 'Review underperformers',
      body: `${losingHolding.name} is down ${Math.abs(getHoldingPnlPercent(losingHolding)).toFixed(1)}%.`,
      createdAt: now,
    });
  }

  return insights;
};

export const buildWealthOverview = (
  userId: string,
  accounts: PortfolioAccount[],
  holdings: PortfolioHolding[]
): WealthOverview => ({
  snapshot: buildWealthSnapshot(userId, accounts, holdings),
  allocation: buildAssetAllocation(holdings),
  topHoldings: [...holdings].sort((a, b) => b.currentValue - a.currentValue).slice(0, 5),
  insights: buildWealthInsights(holdings),
});
