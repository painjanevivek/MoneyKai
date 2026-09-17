import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getCategoryById } from '../../constants/categories';
import { BorderRadius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { type SpendingRunway } from '../../utils/spendingRunway';
import { formatCurrency } from '../../utils/formatCurrency';
import { Card } from '../ui/Card';

type WeeklySpendingRunwayCardProps = {
  runway: SpendingRunway;
  onPress: () => void;
};

const stateCopy = {
  'no-budget': {
    badge: 'Budget needed',
    body: 'Set a monthly budget to see a safe daily spending limit.',
    icon: 'wallet-outline',
  },
  'no-spending': {
    badge: 'Ready to track',
    body: 'Record an expense to make your spending mix more useful.',
    icon: 'receipt-text-outline',
  },
  'on-track': {
    badge: 'On track',
    body: 'Keep the daily limit in view before your next purchase.',
    icon: 'shield-check-outline',
  },
  'over-budget': {
    badge: 'Needs review',
    body: 'Your monthly budget is used up. Pause optional spending today.',
    icon: 'alert-circle-outline',
  },
  'month-closed': {
    badge: 'Month closed',
    body: 'Review the finished month before planning the next one.',
    icon: 'calendar-check-outline',
  },
} as const;

export function WeeklySpendingRunwayCard({ runway, onPress }: WeeklySpendingRunwayCardProps) {
  const { colors } = useTheme();
  const copy = stateCopy[runway.state];
  const needsAttention = runway.state === 'over-budget';
  const accent = needsAttention ? colors.emergency : colors.primary;
  const topCategory = runway.topCategory
    ? getCategoryById(runway.topCategory.category)?.name ?? runway.topCategory.category
    : 'No spending yet';
  const topCategoryAmount = runway.topCategory ? formatCurrency(runway.topCategory.total) : 'Add an expense';
  const dailyAmount = runway.safeToSpendPerDay === null ? '—' : formatCurrency(runway.safeToSpendPerDay);
  const dayLabel = runway.daysRemaining === 1 ? '1 day left' : `${runway.daysRemaining} days left`;

  return (
    <Card
      style={{
        borderWidth: 1,
        borderColor: needsAttention ? `${colors.emergency}30` : colors.borderLight,
        backgroundColor: colors.surfaceElevated,
        ...Shadows.sm,
        shadowColor: colors.shadowColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
        <View
          style={{
            width: 34,
            height: 34,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: BorderRadius.md,
            backgroundColor: needsAttention ? colors.emergencyBg : colors.primaryBg,
          }}
        >
          <MaterialCommunityIcons name={copy.icon as any} size={18} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 21, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Weekly spending runway
          </Text>
          <Text style={{ marginTop: 1, fontSize: Typography.fontSize.xs, lineHeight: 17, color: colors.textSecondary }}>
            {dayLabel} in this month
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: Spacing.sm,
            paddingVertical: 5,
            borderRadius: BorderRadius.full,
            backgroundColor: needsAttention ? colors.emergencyBg : colors.primaryBg,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: accent }}>{copy.badge}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
        <View style={{ flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Top spend</Text>
          <Text numberOfLines={1} style={{ marginTop: 3, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            {topCategory}
          </Text>
          <Text style={{ marginTop: 1, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{topCategoryAmount}</Text>
        </View>
        <View style={{ flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Safe to spend / day</Text>
          <Text style={{ marginTop: 3, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.bold, color: accent }}>
            {dailyAmount}
          </Text>
          <Text style={{ marginTop: 1, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>from your monthly budget</Text>
        </View>
      </View>

      <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>{copy.body}</Text>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={runway.actionLabel}
        onPress={onPress}
        activeOpacity={0.8}
        style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm }}
      >
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: accent }}>{runway.actionLabel}</Text>
        <MaterialCommunityIcons name="arrow-right" size={16} color={accent} />
      </TouchableOpacity>
    </Card>
  );
}

export default WeeklySpendingRunwayCard;
