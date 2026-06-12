import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { useTheme } from '../../hooks/useTheme';

type MonthlyBudgetSummaryCardProps = {
  monthLabel: string;
  monthlyAllowance: number;
  spent: number;
  remaining: number;
  progress: number;
};

export function MonthlyBudgetSummaryCard({
  monthLabel,
  monthlyAllowance,
  spent,
  remaining,
  progress,
}: MonthlyBudgetSummaryCardProps) {
  const { colors } = useTheme();
  const overBudget = remaining < 0;
  const remainingLabel = overBudget ? 'Overspent' : 'Available';
  const remainingAmount = overBudget ? Math.abs(remaining) : remaining;
  const statusColor = overBudget ? colors.chart5 : colors.chart6;
  const progressLabel = `Budget used (${Math.round(progress)}%)`;

  return (
    <Card
      variant="elevated"
      style={{
        gap: Spacing.md,
        borderRadius: BorderRadius['2xl'],
        borderWidth: 1,
        borderColor: `${colors.primary}12`,
        backgroundColor: colors.surfaceElevated,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
            Monthly Budget
          </Text>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.display, color: colors.textPrimary, marginTop: 2 }}>
            {monthLabel}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: Spacing.md,
            paddingVertical: 6,
            borderRadius: BorderRadius.full,
            backgroundColor: overBudget ? colors.emergencyBg : colors.primaryBg,
            borderWidth: 1,
            borderColor: overBudget ? `${colors.emergency}30` : `${colors.primary}20`,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: overBudget ? colors.emergency : colors.primary }}>
            {overBudget ? 'Over budget' : 'On track'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <View style={{ flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Budget</Text>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            {formatCurrency(monthlyAllowance)}
          </Text>
        </View>
        <View style={{ flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Spent</Text>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            {formatCurrency(spent)}
          </Text>
        </View>
        <View style={{ flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{remainingLabel}</Text>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: statusColor }}>
            {formatCurrency(remainingAmount)}
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={progress}
        color={statusColor}
        height={8}
        label={progressLabel}
      />
      {overBudget ? (
        <Text style={{ fontSize: Typography.fontSize.xs, color: statusColor }}>
          You are {formatCurrency(Math.abs(remaining))} over your monthly budget.
        </Text>
      ) : (
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
          You have {formatCurrency(remaining)} left for the selected month.
        </Text>
      )}
    </Card>
  );
}

export default MonthlyBudgetSummaryCard;
