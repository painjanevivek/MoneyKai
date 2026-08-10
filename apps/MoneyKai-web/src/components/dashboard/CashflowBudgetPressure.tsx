import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import type { CashflowPlan } from '../../utils/cashflowPlan';
import { withAlpha } from '../../utils/glassStyle';
import { Button } from '../ui/Button';
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
  const usage = hasBudget
    ? Math.min(100, Math.max(0, (actualExpense / monthlyAllowance) * 100))
    : 0;
  const tone: BudgetTone = !hasBudget
    ? 'neutral'
    : usage >= 100
      ? 'danger'
      : usage >= 80
        ? 'warning'
        : 'success';
  const label = !hasBudget
    ? 'Budget not set'
    : usage >= 100
      ? 'Over budget'
      : usage >= 80
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

  return (
    <View testID="budget-pressure" style={styles.root}>
      <Card
        variant="glass"
        tone={tone === 'neutral' ? 'default' : tone}
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

        <View style={styles.usageRow}>
          <View>
            <Text style={[styles.usageValue, { color: colors.textPrimary }]}>{Math.round(usage)}%</Text>
            <Text style={[styles.usageCaption, { color: colors.textSecondary }]}>of budget used</Text>
          </View>
          <Text style={[styles.allowance, { color: colors.textSecondary }]} numberOfLines={1}>
            {hasBudget ? `${formatCurrency(monthlyAllowance)} monthly` : 'Add a monthly allowance'}
          </Text>
        </View>

        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`${label}. ${Math.round(usage)} percent of monthly budget used.`}
          accessibilityValue={{ min: 0, max: 100, now: Math.round(usage) }}
          style={[styles.track, { backgroundColor: colors.borderLight }]}
        >
          <View style={[styles.fill, { width: `${usage}%`, backgroundColor: toneColor }]} />
        </View>

        <View style={styles.metrics}>
          {[
            { label: 'Spent', value: actualExpense },
            { label: 'Budget available', value: budgetAvailable },
            { label: 'Safe to spend', value: safeToSpend },
          ].map((metric) => (
            <View key={metric.label} style={[styles.metric, { borderColor: colors.borderLight }]}>
              <Text style={[styles.metricLabel, { color: colors.textTertiary }]}>{metric.label}</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {formatCurrency(metric.value)}
              </Text>
            </View>
          ))}
        </View>

        <Button
          title="Adjust budget"
          icon="tune-variant"
          variant="outline"
          size="sm"
          onPress={onAdjustBudget}
          style={styles.action}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minWidth: 0 },
  card: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  title: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.md, lineHeight: Typography.lineHeight.md, fontFamily: Typography.fontFamily.semiBold },
  statePill: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1 },
  stateLabel: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },
  usageRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.md, marginTop: Spacing.lg },
  usageValue: { fontSize: Typography.fontSize['3xl'], lineHeight: Typography.lineHeight['3xl'], fontFamily: Typography.fontFamily.bold },
  usageCaption: { fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, fontFamily: Typography.fontFamily.regular },
  allowance: { flex: 1, minWidth: 0, textAlign: 'right', fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, fontFamily: Typography.fontFamily.medium },
  track: { height: Spacing.sm, borderRadius: BorderRadius.full, overflow: 'hidden', marginTop: Spacing.md },
  fill: { height: '100%', borderRadius: BorderRadius.full },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
  metric: { flexGrow: 1, flexBasis: 96, minWidth: 0, borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.sm },
  metricLabel: { fontSize: Typography.fontSize.xs, lineHeight: Typography.lineHeight.xs, fontFamily: Typography.fontFamily.medium },
  metricValue: { marginTop: Spacing.xs, fontSize: Typography.fontSize.base, lineHeight: Typography.lineHeight.base, fontFamily: Typography.fontFamily.semiBold },
  action: { alignSelf: 'flex-start', marginTop: Spacing.lg },
});

export default CashflowBudgetPressure;
