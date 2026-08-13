import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import { router } from 'expo-router';
import { getCategoryById } from '../../constants/categories';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import type { CashflowPlan } from '../../utils/cashflowPlan';
import { withAlpha } from '../../utils/glassStyle';
import { Card } from '../ui/Card';

interface CashflowBudgetPressureProps {
  plan: CashflowPlan;
  monthlyAllowance: number;
  onAdjustBudget: () => void;
}

type BudgetTone = 'neutral' | 'danger' | 'warning' | 'success';

export function CashflowBudgetPressure({
  plan,
  monthlyAllowance,
  onAdjustBudget,
}: CashflowBudgetPressureProps) {
  const { colors } = useTheme();
  const { actualExpense, budgetAvailable, safeToSpend } = plan.metrics;
  const hasBudget = plan.hasBudget && Number.isFinite(monthlyAllowance) && monthlyAllowance > 0;
  const usage = hasBudget ? Math.max(0, (actualExpense / monthlyAllowance) * 100) : null;
  const progressUsage = Math.min(100, usage ?? 0);
  const tone: BudgetTone = !hasBudget
    ? 'neutral'
    : (usage ?? 0) >= 100
      ? 'danger'
      : (usage ?? 0) >= 80
        ? 'warning'
        : 'success';
  const label = !hasBudget
    ? 'Budget not set'
    : (usage ?? 0) >= 100
      ? 'Over budget'
      : (usage ?? 0) >= 80
        ? 'Watch'
        : 'On track';
  const toneColor = {
    neutral: colors.textTertiary,
    danger: colors.error,
    warning: colors.warning,
    success: colors.success,
  }[tone];
  const toneIcon: keyof typeof MaterialCommunityIcons.glyphMap = {
    neutral: 'wallet-plus-outline',
    danger: 'alert-circle-outline',
    warning: 'alert-outline',
    success: 'check-circle-outline',
  }[tone] as keyof typeof MaterialCommunityIcons.glyphMap;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const availablePercent = hasBudget
    ? Math.max(0, Math.min(100, (Math.max(0, safeToSpend) / monthlyAllowance) * 100))
    : 0;
  const showAvailableCapacity = hasBudget && (usage ?? 0) === 0;
  const topCategory = plan.categories[0];
  const topCategoryLabel = topCategory
    ? getCategoryById(topCategory.category)?.name ?? topCategory.category.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : null;
  const nextCommitment = plan.commitments[0];
  const alerts = [
    topCategory && topCategoryLabel
      ? {
          icon: progressUsage >= 80 ? 'alert-outline' : 'chart-donut',
          tone: progressUsage >= 80 ? colors.warning : colors.info,
          title: `${topCategoryLabel} is ${Math.round(topCategory.percentage)}% of spending`,
          detail: `${formatCurrency(topCategory.total)} in this reporting month`,
          action: 'View report',
          onPress: () => router.push('/reports' as any),
        }
      : null,
    nextCommitment
      ? {
          icon: 'calendar-clock-outline',
          tone: colors.warning,
          title: `${nextCommitment.label} is expected this month`,
          detail: `${formatCurrency(nextCommitment.amount)} from reviewed transaction history`,
          action: 'View bills',
          onPress: () => router.push('/transactions' as any),
        }
      : null,
    hasBudget
      ? {
          icon: safeToSpend > 0 ? 'lightbulb-outline' : 'alert-circle-outline',
          tone: safeToSpend > 0 ? colors.info : colors.error,
          title: safeToSpend > 0 ? 'You can save more' : 'Safe-to-spend is exhausted',
          detail: `${formatCurrency(Math.max(0, safeToSpend))} safe to spend after commitments`,
          action: 'Adjust budget',
          onPress: onAdjustBudget,
        }
      : null,
  ].filter((alert): alert is NonNullable<typeof alert> => alert !== null);

  return (
    <View testID="budget-pressure" style={styles.root}>
      <Card
        variant="glass"
        padding="md"
        style={styles.card}
      >
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>Budget pressure</Text>
          <View
            style={[
              styles.statePill,
              {
                backgroundColor: withAlpha(toneColor, 0.12),
                borderColor: withAlpha(toneColor, 0.28),
              },
            ]}
          >
            <MaterialCommunityIcons name={toneIcon} size={16} color={toneColor} />
            <Text style={[styles.stateLabel, { color: toneColor }]}>{label}</Text>
          </View>
        </View>

        <View style={styles.overview}>
          <View
            accessible
            accessibilityRole={hasBudget ? 'progressbar' : undefined}
            accessibilityLabel={hasBudget ? `${label}. ${Math.round(progressUsage)} percent of monthly budget used.` : 'Budget not set. Add a monthly allowance to track usage.'}
            accessibilityValue={hasBudget ? { min: 0, max: 100, now: Math.round(progressUsage) } : undefined}
            style={styles.donut}
          >
            <View aria-hidden={true}>
              <Svg width={144} height={144} viewBox="0 0 144 144" focusable={false}>
                <G transform="rotate(-90 72 72)">
                  <Circle cx={72} cy={72} r={radius} fill="none" stroke={colors.borderLight} strokeWidth={14} />
                  <Circle
                    cx={72}
                    cy={72}
                    r={radius}
                    fill="none"
                    stroke={showAvailableCapacity ? colors.success : toneColor}
                    strokeWidth={14}
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={circumference * (1 - (showAvailableCapacity ? 1 : progressUsage / 100))}
                  />
                </G>
              </Svg>
            </View>
            <View pointerEvents="none" style={styles.donutLabel}>
              <Text style={[styles.usageValue, { color: colors.textPrimary }]}>
                {hasBudget ? `${Math.round(showAvailableCapacity ? availablePercent : usage ?? 0)}%` : '—'}
              </Text>
              <Text style={[styles.usageCaption, { color: colors.textSecondary }]}>
                {hasBudget ? (showAvailableCapacity ? 'spendable' : 'budget used') : 'Set a budget'}
              </Text>
            </View>
          </View>

          <View style={styles.legend}>
            {[
              { label: 'Available', value: hasBudget ? formatCurrency(budgetAvailable) : 'Not set', color: colors.success },
              { label: 'Committed', value: formatCurrency(plan.metrics.upcomingCommitments), color: colors.warning },
              { label: 'Spendable', value: hasBudget ? formatCurrency(safeToSpend) : 'Not set', color: colors.info },
            ].map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                <Text style={[styles.legendValue, { color: colors.textPrimary }]} numberOfLines={1}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.alerts, { borderTopColor: colors.borderLight }]}>
          <View style={styles.alertsHeader}>
            <Text style={[styles.alertsTitle, { color: colors.textPrimary }]}>Plan signals</Text>
            <Pressable accessibilityRole="button" onPress={onAdjustBudget}>
              <Text style={[styles.viewAll, { color: colors.info }]}>View all</Text>
            </Pressable>
          </View>
          {alerts.map((alert) => (
            <View key={alert.title} style={styles.alertRow}>
              <MaterialCommunityIcons name={alert.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color={alert.tone} />
              <View style={styles.alertBody}>
                <Text style={[styles.alertTitle, { color: colors.textPrimary }]} numberOfLines={1}>{alert.title}</Text>
                <Text style={[styles.alertDetail, { color: colors.textSecondary }]} numberOfLines={1}>{alert.detail}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={alert.onPress}>
                <Text style={[styles.alertAction, { color: colors.info }]} numberOfLines={1}>{alert.action}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minWidth: 0 },
  card: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  title: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.md, lineHeight: Typography.lineHeight.md, fontFamily: Typography.fontFamily.semiBold },
  statePill: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1 },
  stateLabel: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },
  overview: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginTop: Spacing.sm, minHeight: 150 },
  donut: { width: 144, height: 144, alignItems: 'center', justifyContent: 'center' },
  donutLabel: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  usageValue: { fontSize: Typography.fontSize['2xl'], lineHeight: Typography.lineHeight['2xl'], fontFamily: Typography.fontFamily.bold },
  usageCaption: { marginTop: 1, fontSize: 11, lineHeight: 15, fontFamily: Typography.fontFamily.regular },
  legend: { flex: 1, minWidth: 0, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.xs },
  legendValue: { maxWidth: '45%', fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, textAlign: 'right' },
  alerts: { borderTopWidth: 1, marginTop: Spacing.sm, paddingTop: Spacing.sm },
  alertsHeader: { minHeight: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertsTitle: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },
  viewAll: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium },
  alertRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 9 },
  alertBody: { flex: 1, minWidth: 0 },
  alertTitle: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium },
  alertDetail: { marginTop: 2, fontSize: 11 },
  alertAction: { fontSize: 11, fontFamily: Typography.fontFamily.medium },
});

export default CashflowBudgetPressure;
