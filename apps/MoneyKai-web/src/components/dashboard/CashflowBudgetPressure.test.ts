import React, { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { CashflowPlan } from '../../utils/cashflowPlan';
import { CashflowBudgetPressure } from './CashflowBudgetPressure';

vi.mock('react-native', () => ({
  Dimensions: { get: () => ({ width: 1024, height: 768 }) },
  Platform: { OS: 'web' },
  StyleSheet: { create: <T,>(styles: T) => styles },
  Text: () => null,
  View: () => null,
}));

vi.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: Object.assign(() => null, { glyphMap: {} }),
}));

vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      borderLight: '#000000',
      error: '#000000',
      success: '#000000',
      textPrimary: '#000000',
      textSecondary: '#000000',
      textTertiary: '#000000',
      warning: '#000000',
    },
  }),
}));

vi.mock('../../utils/formatCurrency', () => ({
  formatCurrency: (value: number) => `INR ${value}`,
}));

vi.mock('../ui/Button', () => ({ Button: () => null }));
vi.mock('../ui/Card', () => ({ Card: () => null }));

const plan: CashflowPlan = {
  metrics: {
    budgetAvailable: 2_000,
    safeToSpend: 1_500,
    upcomingCommitments: 500,
    forecastNetFlow: 3_000,
    actualIncome: 5_000,
    actualExpense: 2_000,
  },
  timeline: [],
  commitments: [],
  categories: [],
  goals: [],
  isForecastAvailable: true,
  hasBudget: true,
  ignoredTransactionCount: 0,
};

const collectText = (node: ReactNode): string[] => {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(collectText);
  if (!React.isValidElement(node)) return [];
  return collectText((node.props as { children?: ReactNode }).children);
};

const metricLabels = new Set(['Spent', 'Budget available', 'Safe to spend', 'Budget used']);

const renderBudgetPressure = (cashflowPlan: CashflowPlan, monthlyAllowance: number) =>
  CashflowBudgetPressure({
    plan: cashflowPlan,
    monthlyAllowance,
    onAdjustBudget: vi.fn(),
  });

const renderMetricRows = (cashflowPlan: CashflowPlan, monthlyAllowance: number) => {
  const rows: { label: string; value: string }[] = [];
  const visit = (node: ReactNode) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!React.isValidElement(node)) return;
    const children = React.Children.toArray(
      (node.props as { children?: ReactNode }).children,
    );
    if (children.length === 2 && children.every(React.isValidElement)) {
      const label = collectText(children[0]).join('');
      if (metricLabels.has(label)) {
        rows.push({ label, value: collectText(children[1]).join('') });
      }
    }
    children.forEach(visit);
  };

  visit(renderBudgetPressure(cashflowPlan, monthlyAllowance));
  return rows;
};

const findByAccessibilityRole = (node: ReactNode, role: string): React.ReactElement<{
  accessibilityRole?: string;
  accessibilityValue?: { min: number; max: number; now: number };
  children?: ReactNode;
}> | undefined => {
  if (Array.isArray(node)) {
    return node.map((child) => findByAccessibilityRole(child, role)).find(Boolean);
  }
  if (!React.isValidElement(node)) return undefined;
  const props = node.props as { accessibilityRole?: string; children?: ReactNode };
  if (props.accessibilityRole === role) {
    return node as React.ReactElement<{
      accessibilityRole?: string;
      accessibilityValue?: { min: number; max: number; now: number };
      children?: ReactNode;
    }>;
  }
  return findByAccessibilityRole(props.children, role);
};

describe('CashflowBudgetPressure period metrics', () => {
  it('keeps safe-to-spend current and uses budget-used for a historical period', () => {
    expect(renderMetricRows(plan, 4_000)).toEqual([
      { label: 'Spent', value: 'INR 2000' },
      { label: 'Budget available', value: 'INR 2000' },
      { label: 'Safe to spend', value: 'INR 1500' },
    ]);
    expect(renderMetricRows({ ...plan, isForecastAvailable: false }, 4_000)).toEqual([
      { label: 'Spent', value: 'INR 2000' },
      { label: 'Budget available', value: 'INR 2000' },
      { label: 'Budget used', value: '50%' },
    ]);
  });

  it('reports uncapped historical usage while clamping only progress representation', () => {
    const overBudgetPlan = {
      ...plan,
      metrics: {
        ...plan.metrics,
        actualExpense: 5_000,
        budgetAvailable: 0,
        safeToSpend: 0,
      },
      isForecastAvailable: false,
    };
    const rendered = renderBudgetPressure(overBudgetPlan, 4_000);
    const progress = findByAccessibilityRole(rendered, 'progressbar');
    const fill = React.Children.only(progress?.props.children) as React.ReactElement<{
      style: unknown[];
    }>;

    expect(renderMetricRows(overBudgetPlan, 4_000)).toContainEqual({
      label: 'Budget used',
      value: '125%',
    });
    expect(collectText(rendered)).toContain('125%');
    expect(progress?.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
    expect(fill.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ width: '100%' }),
    ]));
  });

  it('describes unavailable budget metrics truthfully when no budget is set', () => {
    const noBudgetPlan = {
      ...plan,
      metrics: { ...plan.metrics, budgetAvailable: 0, safeToSpend: 0 },
      hasBudget: false,
    };

    expect(renderMetricRows(noBudgetPlan, 0)).toEqual([
      { label: 'Spent', value: 'INR 2000' },
      { label: 'Budget available', value: 'Budget not set.' },
      { label: 'Safe to spend', value: 'Budget not set.' },
    ]);
    expect(renderMetricRows({ ...noBudgetPlan, isForecastAvailable: false }, 0)).toEqual([
      { label: 'Spent', value: 'INR 2000' },
      { label: 'Budget available', value: 'Budget not set.' },
      { label: 'Budget used', value: 'Budget not set.' },
    ]);

    const rendered = renderBudgetPressure(noBudgetPlan, 0);
    const text = collectText(rendered);
    const renderedText = text.join('');
    expect(text).toEqual(expect.arrayContaining([
      'Budget usage unavailable',
      'Set a budget to track usage',
    ]));
    expect(renderedText).not.toContain('0%');
    expect(renderedText).not.toContain('of budget used');
    expect(findByAccessibilityRole(rendered, 'progressbar')).toBeUndefined();
  });
});
