import { describe, expect, it } from 'vitest';
import type { PortfolioHolding } from '@/types/portfolio';
import { buildAssetAllocation, buildWealthSnapshot } from './wealthAnalytics';

const holding = (overrides: Partial<PortfolioHolding>): PortfolioHolding => ({
  id: overrides.id ?? 'holding-1',
  userId: 'user-1',
  accountId: 'account-1',
  assetType: overrides.assetType ?? 'equity',
  name: overrides.name ?? 'Example Equity',
  quantity: overrides.quantity ?? 1,
  investedValue: overrides.investedValue ?? 100,
  currentValue: overrides.currentValue ?? 120,
  currency: 'INR',
  asOfDate: '2026-06-13',
  source: 'test',
  ...overrides,
});

describe('wealthAnalytics', () => {
  it('builds a snapshot with liabilities separated from assets', () => {
    const snapshot = buildWealthSnapshot(
      'user-1',
      [],
      [
        holding({ id: 'equity', currentValue: 1000, investedValue: 800 }),
        holding({ id: 'loan', assetType: 'loan', currentValue: 300, investedValue: 300 }),
      ],
      '2026-06-13T00:00:00Z'
    );

    expect(snapshot.totalAssets).toBe(1000);
    expect(snapshot.totalLiabilities).toBe(300);
    expect(snapshot.netWorth).toBe(700);
    expect(snapshot.totalPnl).toBe(200);
  });

  it('groups allocation by asset type', () => {
    const allocation = buildAssetAllocation([
      holding({ id: 'equity', assetType: 'equity', currentValue: 600 }),
      holding({ id: 'mf', assetType: 'mutual_fund', currentValue: 400 }),
    ]);

    expect(allocation).toHaveLength(2);
    expect(allocation[0]).toMatchObject({ assetType: 'equity', percent: 60 });
    expect(allocation[1]).toMatchObject({ assetType: 'mutual_fund', percent: 40 });
  });
});
