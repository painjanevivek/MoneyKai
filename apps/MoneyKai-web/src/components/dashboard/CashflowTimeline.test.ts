import React, { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { CashflowPlan } from '@/utils/cashflowPlan';
import { CashflowTimeline, buildPath, getChartDomain, getX, getY } from './CashflowTimeline';

vi.mock('react-native', () => ({
  Dimensions: { get: () => ({ width: 1024, height: 768 }) },
  Platform: { OS: 'web' },
  Modal: () => null,
  Pressable: () => null,
  ScrollView: () => null,
  Text: () => null,
  View: () => null,
  useWindowDimensions: () => ({ width: 1024, height: 768 }),
}));

vi.mock('react-native-svg', () => {
  const SvgNode = () => null;
  return {
    default: SvgNode,
    Circle: SvgNode,
    G: SvgNode,
    Line: SvgNode,
    Path: SvgNode,
    Rect: SvgNode,
    Text: SvgNode,
  };
});

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      accentLight: '#000000',
      border: '#000000',
      borderLight: '#000000',
      chart2: '#000000',
      info: '#000000',
      success: '#000000',
      surface: '#000000',
      surfaceElevated: '#000000',
      textPrimary: '#000000',
      textSecondary: '#000000',
      textTertiary: '#000000',
      warning: '#000000',
    },
  }),
}));
vi.mock('@/utils/formatCurrency', () => ({
  formatCompactCurrency: (value: number) => String(value),
  formatCurrency: (value: number) => String(value),
}));
vi.mock('../ui/Button', () => ({ Button: () => null }));
vi.mock('../ui/Card', () => ({ Card: () => null }));
vi.mock('../ui/EmptyState', () => ({ EmptyState: () => null }));

vi.spyOn(React, 'useState').mockReturnValue([false, vi.fn()]);

const makePlan = (isForecastAvailable: boolean): CashflowPlan => ({
  metrics: {
    budgetAvailable: 10_000,
    safeToSpend: 7_500,
    upcomingCommitments: 2_500,
    forecastNetFlow: 8_000,
    actualIncome: 5_000,
    actualExpense: 2_000,
  },
  timeline: [
    {
      date: '2026-07-01',
      actualNetFlow: 1_000,
      projectedNetFlow: 1_000,
      actualEvents: [],
      projectedEvents: [],
    },
    {
      date: '2026-07-31',
      actualNetFlow: 3_000,
      projectedNetFlow: 8_000,
      actualEvents: [],
      projectedEvents: [],
    },
  ],
  commitments: [],
  categories: [],
  goals: [],
  isForecastAvailable,
  hasBudget: true,
  ignoredTransactionCount: 0,
});

const collectText = (node: ReactNode): string[] => {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(collectText);
  if (!React.isValidElement(node)) return [];
  return collectText((node.props as { children?: ReactNode }).children);
};

describe('cashflow chart helpers', () => {
  it('places one point and multi-point endpoints deterministically', () => {
    expect(getX(0, 1, 240)).toBe(0);
    expect(getX(0, 3, 240)).toBe(0);
    expect(getX(2, 3, 240)).toBe(240);
  });

  it('keeps a flat range finite', () => {
    const y = getY(0, 0, 0, 180);

    expect(y).toBe(180);
    expect(Number.isFinite(y)).toBe(true);
  });

  it('starts a new SVG segment after missing values', () => {
    expect(buildPath([0, null, 10], 100, 100, 0, 10)).toBe('M 0 100 M 100 0');
  });

  it('pads a crossing range and ignores non-finite values', () => {
    expect(getChartDomain([-50, 100, null, Number.NaN])).toEqual({ min: -65, max: 115 });
  });

  it('returns a safe domain for empty and flat-zero data', () => {
    expect(getChartDomain([])).toEqual({ min: -1, max: 1 });
    expect(getChartDomain([0, 0])).toEqual({ min: -1, max: 1 });
  });
});

describe('CashflowTimeline summary', () => {
  it('selects forecast rows only for an open period and closed status for a historical period', () => {
    const currentText = collectText(CashflowTimeline({
      plan: makePlan(true),
      onViewTransactions: vi.fn(),
    }));
    const historicalText = collectText(CashflowTimeline({
      plan: makePlan(false),
      onViewTransactions: vi.fn(),
    }));

    expect(currentText).toEqual(expect.arrayContaining([
      'Projected balance',
      'Recurring expense',
      'Forecast net flow on 31 Jul',
      '8000',
    ]));
    expect(historicalText).toEqual(expect.arrayContaining([
      'Projected balance',
      'Closed reporting period',
      'Actual net flow for closed period',
      '3000',
    ]));
    expect(historicalText).not.toContain('Recurring expense');
    expect(historicalText).not.toContain('Forecast net flow on 31 Jul');
  });
});
