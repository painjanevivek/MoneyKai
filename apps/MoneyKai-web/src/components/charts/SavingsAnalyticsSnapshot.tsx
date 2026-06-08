import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDays, endOfDay, isWithinInterval, startOfWeek } from 'date-fns';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { getCategoryById } from '../../constants/categories';
import { generateInsights } from '../../utils/insightEngine';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';

export const SavingsAnalyticsSnapshot: React.FC = () => {
  const { colors } = useTheme();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const transactions = useTransactionStore((s) => s.transactions);
  const { settings } = useBudgetStore();

  const insights = generateInsights(settings.monthly_allowance, totalSpent, categoryTotals);

  const remaining = settings.monthly_allowance - totalSpent;
  const savingsRate = settings.monthly_allowance > 0 ? (remaining / settings.monthly_allowance) * 100 : 0;
  const savingsToneColor = savingsRate >= 0 ? colors.primary : colors.emergency;

  const topCategory = useMemo(() => {
    return categoryTotals[0] ? getCategoryById(categoryTotals[0].category)?.name ?? categoryTotals[0].category : 'No spending yet';
  }, [categoryTotals]);

  const weeklyData = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) => {
      const dayStart = addDays(weekStart, index);
      const dayEnd = endOfDay(dayStart);
      const value = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, transaction) => {
          const date = new Date(transaction.transaction_date);
          return isWithinInterval(date, { start: dayStart, end: dayEnd }) ? sum + transaction.amount : sum;
        }, 0);

      return {
        value,
        label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index],
        frontColor: index >= 5 ? colors.accent : colors.primary,
      };
    });
  }, [colors.accent, colors.primary, transactions]);

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
            Savings position
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
          <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>Savings rate</Text>
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
          This week
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
            yAxisLabelPrefix="₹"
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
                name={(insight.icon || 'lightbulb-outline') as any}
                size={16}
                color={insight.type === 'warning' ? colors.accent : insight.type === 'achievement' ? colors.primaryLight : colors.primary}
                style={{ marginTop: 2 }}
              />
              <Text style={{ flex: 1, fontSize: Typography.fontSize.xs, color: colors.textPrimary, lineHeight: 18 }}>
                {insight.message}
              </Text>
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
