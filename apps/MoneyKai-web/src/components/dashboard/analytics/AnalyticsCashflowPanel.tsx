import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { CashflowPlan } from '@/utils/cashflowPlan';
import { formatCurrency } from '@/utils/formatCurrency';
import { CashflowTimeline } from '../CashflowTimeline';

export function AnalyticsCashflowPanel({ plan, onViewTransactions }: { plan: CashflowPlan; onViewTransactions: () => void }) {
  const { colors } = useTheme();
  const [insightIndex, setInsightIndex] = React.useState(0);
  const netFlow = plan.metrics.actualIncome - plan.metrics.actualExpense;
  const highestCategory = plan.categories[0];
  const insights = [
    {
      title: netFlow >= 0 ? 'Positive cashflow maintained' : 'Cashflow needs attention',
      body: netFlow >= 0 ? `Income is ahead of reviewed expenses by ${formatCurrency(netFlow)}.` : `Reviewed expenses exceed income by ${formatCurrency(Math.abs(netFlow))}.`,
      icon: netFlow >= 0 ? 'trending-up' as const : 'trending-down' as const,
      tone: netFlow >= 0 ? colors.success : colors.error,
    },
    {
      title: highestCategory ? `${highestCategory.category.replace(/[-_]/g, ' ')} leads spending` : 'Category signal is waiting',
      body: highestCategory ? `${formatCurrency(highestCategory.total)} accounts for ${Math.round(highestCategory.percentage)}% of reviewed expense.` : 'Add reviewed expenses to reveal the strongest spending pattern.',
      icon: 'shape-outline' as const,
      tone: colors.warning,
    },
    {
      title: plan.isForecastAvailable ? 'Month-end forecast is available' : 'Forecast needs current-period data',
      body: plan.isForecastAvailable ? `MoneyKai projects a net flow of ${formatCurrency(plan.metrics.forecastNetFlow)} after recurring commitments.` : 'Open the current reporting month to see projected recurring commitments.',
      icon: 'chart-timeline-variant' as const,
      tone: colors.info,
    },
  ];
  const insight = insights[insightIndex];

  return (
    <View style={{ flex: 2.1, minWidth: 0, minHeight: 430, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.card }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <MaterialCommunityIcons name="trending-up" size={21} color={colors.textSecondary} />
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>Cashflow flow</Text>
        </View>
        <MaterialCommunityIcons name="dots-horizontal" size={21} color={colors.textTertiary} />
      </View>
      <View style={{ marginTop: Spacing.lg, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: Spacing.lg }}>
        <View style={{ minWidth: 210 }}>
          <Text style={{ fontSize: Typography.fontSize['3xl'], lineHeight: Typography.lineHeight['3xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>{formatCurrency(plan.metrics.actualIncome)}</Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>Reviewed income</Text>
          <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: netFlow >= 0 ? colors.success : colors.error }}>{netFlow >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netFlow))} net flow</Text>
        </View>
        <View style={{ flex: 1, minWidth: 260, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderLight }}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
            <View style={{ width: 34, height: 34, borderRadius: BorderRadius.sm, backgroundColor: `${insight.tone}18`, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={insight.icon} size={18} color={insight.tone} /></View>
            <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{insight.title}</Text>
          </View>
          <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>{insight.body}</Text>
          <View style={{ marginTop: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous insight" onPress={() => setInsightIndex((current) => (current + insights.length - 1) % insights.length)}><MaterialCommunityIcons name="chevron-left" size={22} color={colors.textTertiary} /></TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 5 }}>{insights.map((_, index) => <View key={index} style={{ width: index === insightIndex ? 24 : 8, height: 4, borderRadius: BorderRadius.full, backgroundColor: index === insightIndex ? colors.primary : colors.border }} />)}</View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next insight" onPress={() => setInsightIndex((current) => (current + 1) % insights.length)}><MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} /></TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={{ marginTop: Spacing.lg }}><CashflowTimeline plan={plan} onViewTransactions={onViewTransactions} /></View>
    </View>
  );
}
