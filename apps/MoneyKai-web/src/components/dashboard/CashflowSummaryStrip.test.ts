import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { CashflowPlan } from '@/utils/cashflowPlan';
import { CashflowSummaryStrip } from './CashflowSummaryStrip';

const dimensions = vi.hoisted(() => ({ width: 1024 }));

vi.mock('react-native', () => ({
  Dimensions: { get: () => ({ width: dimensions.width, height: 768 }) },
  Text: () => null,
  View: () => null,
  useWindowDimensions: () => ({ width: dimensions.width, height: 768 }),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      borderLight: 'border',
      card: 'card',
      error: 'error',
      primary: 'primary',
      success: 'success',
      textSecondary: 'secondary',
      textTertiary: 'tertiary',
      warning: 'warning',
    },
  }),
}));

vi.mock('@/utils/formatCurrency', () => ({
  formatCurrency: (value: number) => `INR ${value}`,
}));

const plan: CashflowPlan = {
  metrics: {
    budgetAvailable: 123_456_789_012,
    safeToSpend: 7_500,
    upcomingCommitments: 2_500,
    forecastNetFlow: 8_000,
    actualIncome: 5_000,
    actualExpense: 2_000,
  },
  timeline: [],
  commitments: [],
  recurrenceCandidates: [],
  categories: [],
  goals: [],
  isForecastAvailable: true,
  hasBudget: true,
  ignoredTransactionCount: 0,
};

const renderMetricCells = (width: number, cashflowPlan: CashflowPlan = plan) => {
  dimensions.width = width;
  const summary = CashflowSummaryStrip({ plan: cashflowPlan });
  return React.Children.toArray(
    (summary.props as { children?: React.ReactNode }).children,
  ).filter(React.isValidElement) as React.ReactElement<{
    accessibilityLabel: string;
    children?: React.ReactNode;
    style: { width: string };
  }>[];
};

const metricAccessibilityLabels = (cashflowPlan: CashflowPlan) =>
  renderMetricCells(1024, cashflowPlan).map((cell) => cell.props.accessibilityLabel);

describe('CashflowSummaryStrip period metrics', () => {
  it('keeps current forecasts but uses actual-only metrics for a historical period', () => {
    const currentLabels = metricAccessibilityLabels(plan);
    const historicalLabels = metricAccessibilityLabels({
      ...plan,
      isForecastAvailable: false,
    });

    expect(currentLabels).toEqual([
      'Available now: INR 123456789012',
      'Safe to spend: INR 7500',
      'Upcoming commitments: INR 2500',
      'Forecast month end: INR 8000',
    ]);
    expect(historicalLabels).toEqual([
      'Budget available: INR 123456789012',
      'Actual net flow: INR 3000',
      'Actual income: INR 5000',
      'Actual spending: INR 2000',
    ]);
  });

  it('preserves the no-budget wording for a historical period', () => {
    const historicalLabels = metricAccessibilityLabels({
      ...plan,
      metrics: {
        ...plan.metrics,
        budgetAvailable: 0,
      },
      hasBudget: false,
      isForecastAvailable: false,
    });

    expect(historicalLabels[0]).toBe('Budget available: Budget not set.');
  });
});

describe('CashflowSummaryStrip responsive layout', () => {
  it('selects one, two, and four columns across narrow, intermediate, and wide widths', () => {
    const narrowCells = renderMetricCells(479);
    const intermediateCells = renderMetricCells(480);
    const wideCells = renderMetricCells(760);

    expect(narrowCells.map((cell) => cell.props.style.width)).toEqual(Array(4).fill('100%'));
    expect(intermediateCells.map((cell) => cell.props.style.width)).toEqual(Array(4).fill('50%'));
    expect(wideCells.map((cell) => cell.props.style.width)).toEqual(Array(4).fill('25%'));
  });

  it('allows large INR values to wrap instead of truncating them in the narrow layout', () => {
    const [firstCell] = renderMetricCells(320);
    const value = React.Children.toArray(firstCell.props.children)
      .filter(React.isValidElement)[1] as React.ReactElement<{ numberOfLines?: number }>;

    expect(value.props.numberOfLines).toBeUndefined();
  });
});
