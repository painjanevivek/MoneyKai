import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import type { CashflowPlan } from '@/utils/cashflowPlan';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/formatCurrency';

const metricLabels = [
  'Budget available',
  'Safe to spend',
  'Upcoming commitments',
  'Forecast net flow',
] as const;

type CashflowSummaryStripProps = {
  plan: CashflowPlan;
};

export function CashflowSummaryStrip({ plan }: CashflowSummaryStripProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 760;

  const metricValues = [
    formatCurrency(plan.metrics.budgetAvailable),
    plan.hasBudget ? formatCurrency(plan.metrics.safeToSpend) : 'Budget not set.',
    plan.isForecastAvailable ? formatCurrency(plan.metrics.upcomingCommitments) : 'Closed period.',
    plan.isForecastAvailable ? formatCurrency(plan.metrics.forecastNetFlow) : 'Closed period.',
  ] as const;

  const resolveValueColor = (index: number) => {
    if ((!plan.hasBudget && index === 1) || (!plan.isForecastAvailable && index >= 2)) {
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
        const isLastColumn = index % 2 === 1;
        const isLastRow = index >= 2;

        return (
          <View
            key={label}
            accessible
            accessibilityLabel={`${label}: ${value}`}
            style={{
              width: isCompact ? '50%' : '25%',
              minWidth: 0,
              paddingHorizontal: isCompact ? Spacing.md : Spacing.lg,
              paddingVertical: Spacing.md,
              borderRightWidth: isCompact ? (isLastColumn ? 0 : 1) : (index === metricLabels.length - 1 ? 0 : 1),
              borderBottomWidth: isCompact && !isLastRow ? 1 : 0,
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
              numberOfLines={1}
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
