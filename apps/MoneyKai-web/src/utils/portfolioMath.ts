import type { PortfolioHolding } from '@/types/portfolio';

export const getHoldingPnl = (holding: PortfolioHolding): number =>
  holding.totalPnl ?? holding.currentValue - holding.investedValue;

export const getHoldingPnlPercent = (holding: PortfolioHolding): number => {
  if (holding.totalPnlPercent !== undefined) {
    return holding.totalPnlPercent;
  }
  if (holding.investedValue <= 0) {
    return 0;
  }
  return (getHoldingPnl(holding) / holding.investedValue) * 100;
};

export const sumHoldings = (holdings: PortfolioHolding[]) =>
  holdings.reduce(
    (summary, holding) => {
      summary.investedValue += holding.investedValue;
      summary.currentValue += holding.currentValue;
      summary.dayChange += holding.dayChange ?? 0;
      summary.totalPnl += getHoldingPnl(holding);
      return summary;
    },
    { investedValue: 0, currentValue: 0, dayChange: 0, totalPnl: 0 }
  );

export const formatPercent = (value: number): string =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
