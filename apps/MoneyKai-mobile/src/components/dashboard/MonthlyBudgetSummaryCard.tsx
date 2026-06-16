import React from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
  const statusColor = overBudget ? colors.emergency : colors.success;
  const progressLabel = `${Math.round(progress)}% of monthly budget used`;

  return (
    <Card
      variant="elevated"
      style={{
        gap: Spacing.lg,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: overBudget ? `${colors.emergency}30` : colors.borderLight,
        backgroundColor: colors.surfaceElevated,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
            Monthly budget control
          </Text>
          <Text style={{ fontSize: Typography.fontSize['2xl'], lineHeight: 32, fontFamily: Typography.fontFamily.display, color: colors.textPrimary, marginTop: 2 }}>
            {remainingLabel}: {formatCurrency(remainingAmount)}
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
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: statusColor }}>
            {overBudget ? 'Needs review' : 'On track'}
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={progress}
        color={statusColor}
        height={10}
        label={progressLabel}
      />

      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {[
          ['wallet-outline', 'Budget', formatCurrency(monthlyAllowance)],
          ['arrow-up-right', 'Spent', formatCurrency(spent)],
          ['calendar-month-outline', 'Cycle', monthLabel],
        ].map(([icon, label, value]) => (
          <View
            key={label}
            style={{
              flex: 1,
              minHeight: 82,
              padding: Spacing.sm,
              borderRadius: BorderRadius.md,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <MaterialCommunityIcons name={icon as any} size={17} color={label === 'Spent' ? colors.warning : colors.primary} />
            <Text style={{ marginTop: 7, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{label}</Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.76}
              style={{ marginTop: 2, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}
            >
              {value}
            </Text>
          </View>
        ))}
      </View>

      {overBudget ? (
        <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: statusColor }}>
          You are {formatCurrency(Math.abs(remaining))} over your monthly budget.
        </Text>
      ) : (
        <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
          You have {formatCurrency(remaining)} left for the selected month.
        </Text>
      )}
    </Card>
  );
}

export default MonthlyBudgetSummaryCard;
