import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getCategoryById } from '../../constants/categories';
import { generateDeterministicInsights } from '../../utils/insightEngine';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { convertFromInrForDisplay } from '@/utils/formatCurrency';
import { calendarDateKey, financePeriodProgress, summarizeTransactions, type FinancePeriod } from '@/utils/financeCore';
import type { CategoryTotal, Transaction } from '@/types/transaction';

interface Props {
  categoryTotals: CategoryTotal[];
  monthlyAllowance: number;
  period: FinancePeriod;
  totalSpent: number;
  transactions: Transaction[];
}

const DAY_MS = 86_400_000;

export const SavingsAnalyticsSnapshot: React.FC<Props> = ({ categoryTotals, monthlyAllowance, period, totalSpent, transactions }) => {
  const { colors } = useTheme();
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);

  const financeSummary = useMemo(() => summarizeTransactions(transactions, { period }), [period, transactions]);
  const insights = useMemo(() => generateDeterministicInsights({
    monthlyAllowance,
    current: financeSummary,
    period,
    progress: financePeriodProgress(period),
  }), [financeSummary, monthlyAllowance, period]);

  const remaining = monthlyAllowance - totalSpent;
  const savingsRate = monthlyAllowance > 0 ? (remaining / monthlyAllowance) * 100 : 0;
  const savingsToneColor = savingsRate >= 0 ? colors.primary : colors.emergency;

  const topCategory = useMemo(() => {
    return categoryTotals[0] ? getCategoryById(categoryTotals[0].category)?.name ?? categoryTotals[0].category : 'No spending yet';
  }, [categoryTotals]);

  const weeklyData = useMemo(() => {
    const startOrdinal = Date.parse(`${period.startDate}T00:00:00.000Z`);
    const endOrdinal = Date.parse(`${period.endDateExclusive}T00:00:00.000Z`) - DAY_MS;
    const now = new Date();
    const todayOrdinal = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const chartEnd = todayOrdinal >= startOrdinal && todayOrdinal <= endOrdinal ? todayOrdinal : endOrdinal;
    const valuesByDate = new Map<string, number>();
    transactions.forEach((transaction) => {
      if (transaction.type !== 'expense') return;
      valuesByDate.set(transaction.transaction_date, (valuesByDate.get(transaction.transaction_date) ?? 0) + transaction.amount);
    });
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(chartEnd - (6 - index) * DAY_MS);
      const dateKey = calendarDateKey(date);

      return {
        value: convertFromInrForDisplay(valuesByDate.get(dateKey) ?? 0),
        label: String(date.getUTCDate()),
        frontColor: index === 6 ? colors.accent : colors.primary,
      };
    });
  }, [colors.accent, colors.primary, period.endDateExclusive, period.startDate, transactions]);

  const hasWeeklyData = weeklyData.some((item) => item.value > 0);

  return (
    <Card style={{ flex: 1 }}>
      <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>
        Analytics snapshot
      </Text>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <View style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: `${savingsToneColor}18`,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: `${savingsToneColor}90`,
        }}>
          <MaterialCommunityIcons
            name={savingsRate >= 0 ? 'piggy-bank-outline' : 'alert-circle-outline'}
            size={28}
            color={savingsToneColor}
          />
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Budget position
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
            {remaining >= 0
              ? `${Math.round(Math.max(0, savingsRate))}% of this month's budget is still available.`
              : `Spending is ${Math.abs(Math.round(savingsRate))}% beyond this month's budget.`}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <View style={{
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.md,
          padding: Spacing.sm,
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}>
          <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>Budget buffer</Text>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            {Math.round(Math.max(0, savingsRate))}%
          </Text>
        </View>
        <View style={{
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.md,
          padding: Spacing.sm,
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}>
          <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>Top category</Text>
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }} numberOfLines={1}>
            {topCategory}
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary, marginBottom: 6 }}>
          Last 7 days in this period
        </Text>
        {hasWeeklyData ? (
          <BarChart
            data={weeklyData}
            barWidth={18}
            spacing={10}
            roundedTop
            height={96}
            noOfSections={3}
            yAxisTextStyle={{ fontSize: 9, color: colors.textTertiary }}
            xAxisLabelTextStyle={{ fontSize: 9, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}
            hideRules
            yAxisColor="transparent"
            xAxisColor={colors.borderLight}
            isAnimated
            yAxisLabelPrefix={currencySymbol}
          />
        ) : (
          <View style={{
            minHeight: 96,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: BorderRadius.md,
            borderWidth: 1,
            borderColor: colors.borderLight,
            backgroundColor: colors.surface,
            padding: Spacing.md,
          }}>
            <MaterialCommunityIcons name="chart-bar" size={20} color={colors.textTertiary} />
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 6 }}>
              No spending this week yet
            </Text>
          </View>
        )}
      </View>

      {insights.length > 0 && (
        <View style={{ gap: 6 }}>
          {insights.slice(0, 2).map((insight, index) => (
            <View
              key={insight.id}
              style={{
                flexDirection: 'row',
                gap: 8,
                paddingTop: index > 0 ? 8 : 0,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: colors.borderLight,
              }}
            >
              <MaterialCommunityIcons
                name={(insight.tone === 'warning' ? 'alert-outline' : insight.tone === 'success' ? 'check-circle-outline' : 'lightbulb-outline') as any}
                size={16}
                color={insight.tone === 'warning' ? colors.accent : insight.tone === 'success' ? colors.primaryLight : colors.primary}
                style={{ marginTop: 2 }}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textPrimary, lineHeight: 18 }}>
                  {insight.body}
                </Text>
                <Text style={{ fontSize: 10, color: colors.textTertiary, lineHeight: 15 }}>
                  {insight.caveat}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginTop: Spacing.md }}>
        <ProgressBar progress={Math.max(0, Math.min(100, savingsRate))} color={savingsRate >= 0 ? colors.primary : colors.emergency} height={6} />
      </View>
    </Card>
  );
};

export default SavingsAnalyticsSnapshot;
