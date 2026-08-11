import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import type { CashflowPlan } from '@/utils/cashflowPlan';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/formatCurrency';

const forecastMetricLabels = [
  'Budget available',
  'Safe to spend',
  'Upcoming commitments',
  'Forecast net flow',
] as const;

const historicalMetricLabels = [
  'Budget available',
  'Actual net flow',
  'Actual income',
  'Actual spending',
] as const;

type CashflowSummaryStripProps = {
  plan: CashflowPlan;
};

export function CashflowSummaryStrip({ plan }: CashflowSummaryStripProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 480;
  const isCompact = width < 760;
  const columnCount = isNarrow ? 1 : isCompact ? 2 : 4;
  const cellWidth = isNarrow ? '100%' : isCompact ? '50%' : '25%';
  const metricLabels = plan.isForecastAvailable ? forecastMetricLabels : historicalMetricLabels;
  const actualNetFlow = plan.metrics.actualIncome - plan.metrics.actualExpense;

  const metricValues = plan.isForecastAvailable ? [
    formatCurrency(plan.metrics.budgetAvailable),
    plan.hasBudget ? formatCurrency(plan.metrics.safeToSpend) : 'Budget not set.',
    formatCurrency(plan.metrics.upcomingCommitments),
    formatCurrency(plan.metrics.forecastNetFlow),
  ] as const : [
    plan.hasBudget ? formatCurrency(plan.metrics.budgetAvailable) : 'Budget not set.',
    formatCurrency(actualNetFlow),
    formatCurrency(plan.metrics.actualIncome),
    formatCurrency(plan.metrics.actualExpense),
  ] as const;

  const resolveValueColor = (index: number) => {
    if (!plan.isForecastAvailable) {
      if (!plan.hasBudget && index === 0) return colors.textTertiary;
      if (index === 1) return actualNetFlow < 0 ? colors.error : colors.success;
      if (index === 2) return colors.success;
      if (index === 3) return colors.warning;
      return colors.primary;
    }
    if (!plan.hasBudget && index === 1) {
      return colors.textTertiary;
    }
    if (index === 2) return colors.warning;
    if (index === 3) return plan.metrics.forecastNetFlow < 0 ? colors.error : colors.success;
    return index === 1 ? colors.success : colors.primary;
  };

  return (
    <View
      testID="cashflow-summary"
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
      }}
    >
      {metricLabels.map((label, index) => {
        const value = metricValues[index];
        const isLastColumn = (index + 1) % columnCount === 0;
        const isLastRow = index >= metricLabels.length - columnCount;

        return (
          <View
            key={label}
            accessible
            accessibilityLabel={`${label}: ${value}`}
            style={{
              width: cellWidth,
              minWidth: 0,
              paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
              paddingVertical: Spacing.md,
              borderRightWidth: isLastColumn ? 0 : 1,
              borderBottomWidth: !isLastRow ? 1 : 0,
              borderColor: colors.borderLight,
            }}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                lineHeight: Typography.lineHeight.sm,
                fontFamily: Typography.fontFamily.medium,
                color: colors.textSecondary,
              }}
            >
              {label}
            </Text>
            <Text
              numberOfLines={isNarrow ? undefined : 1}
              style={{
                marginTop: Spacing.xs,
                fontSize: isCompact ? Typography.fontSize.md : Typography.fontSize.lg,
                lineHeight: isCompact ? Typography.lineHeight.md : Typography.lineHeight.lg,
                fontFamily: Typography.fontFamily.semiBold,
                color: resolveValueColor(index),
              }}
            >
              {value}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
