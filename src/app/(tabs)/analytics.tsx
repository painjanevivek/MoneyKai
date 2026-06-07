import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDays, endOfDay, isWithinInterval, startOfWeek } from 'date-fns';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getCategoryById } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatCurrency';
import { calculateBudgetHealth } from '@/utils/savingsEngine';
import { generateInsights } from '@/utils/insightEngine';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const transactions = useTransactionStore((s) => s.transactions);
  const { settings } = useBudgetStore();
  const health = calculateBudgetHealth(settings.monthly_allowance, totalSpent);
  const insights = generateInsights(settings.monthly_allowance, totalSpent, categoryTotals);

  const remaining = settings.monthly_allowance - totalSpent;
  const savingsRate = settings.monthly_allowance > 0 ? (remaining / settings.monthly_allowance) * 100 : 0;
  const expenseCount = transactions.filter((t) => t.type === 'expense').length;

  const pieData = React.useMemo(() => {
    return categoryTotals.slice(0, 6).map((cat) => {
      const catDef = getCategoryById(cat.category);
      return { value: cat.total, color: catDef?.color || colors.chart1, text: `${Math.round(cat.percentage)}%` };
    });
  }, [categoryTotals, colors]);

  const weeklyData = React.useMemo(() => {
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
        label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
        frontColor: index >= 5 ? colors.accent : colors.primary,
      };
    });
  }, [colors.accent, colors.primary, transactions]);

  const hasWeeklyData = weeklyData.some((item) => item.value > 0);

  const renderCenterLabel = React.useCallback(() => {
    return (
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 10, color: colors.textTertiary }}>Total</Text>
        <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
          {formatCurrency(totalSpent)}
        </Text>
      </View>
    );
  }, [colors, totalSpent]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>Analytics & Reports</Text>
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary }}>Your financial overview at a glance</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>Financial Health Score</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${health.color}15`,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 4,
              borderColor: health.color,
            }}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: health.color }}>{health.score}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: health.color }}>{health.label}</Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>{health.message}</Text>
            </View>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
          {[
            { label: 'Savings Rate', value: `${Math.round(savingsRate)}%`, color: savingsRate > 0 ? colors.primary : colors.emergency, icon: 'percent' },
            { label: 'Transactions', value: `${expenseCount}`, color: colors.info, icon: 'receipt' },
            { label: 'Remaining', value: formatCurrency(Math.max(0, remaining)), color: remaining > 0 ? colors.primary : colors.emergency, icon: 'wallet-outline' },
          ].map((stat, i) => (
            <Card key={i} style={{ flex: 1, alignItems: 'center' }}>
              <MaterialCommunityIcons name={stat.icon as any} size={20} color={stat.color} />
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: stat.color, marginTop: 4 }}>{stat.value}</Text>
              <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary, marginTop: 2 }}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>Spending Breakdown</Text>
          {pieData.length > 0 ? (
            <View style={{ alignItems: 'center' }}>
              <PieChart
                data={pieData}
                donut
                radius={80}
                innerRadius={50}
                innerCircleColor={colors.card}
                centerLabelComponent={renderCenterLabel}
              />
            </View>
          ) : null}
          <View style={{ marginTop: Spacing.md }}>
            {categoryTotals.map((cat) => {
              const catDef = getCategoryById(cat.category);
              return (
                <View key={cat.category} style={{ marginBottom: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: catDef?.color || colors.textTertiary }} />
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                        {catDef?.name?.split(' &')[0] || cat.category}
                      </Text>
                    </View>
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {formatCurrency(cat.total)}
                    </Text>
                  </View>
                  <ProgressBar progress={cat.percentage} color={catDef?.color} height={4} />
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>Weekly Spending Pattern</Text>
          {hasWeeklyData ? (
            <>
              <BarChart
                data={weeklyData}
                barWidth={28}
                spacing={15}
                roundedTop
                height={120}
                noOfSections={3}
                yAxisTextStyle={{ fontSize: 10, color: colors.textTertiary }}
                xAxisLabelTextStyle={{ fontSize: 10, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}
                hideRules
                yAxisColor="transparent"
                xAxisColor={colors.borderLight}
                isAnimated
                yAxisLabelPrefix="₹"
              />
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.accentLight,
                borderRadius: BorderRadius.sm,
                padding: Spacing.sm,
                marginTop: Spacing.md,
              }}>
                <MaterialCommunityIcons name="information-outline" size={16} color={colors.accent} />
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.accent, fontFamily: Typography.fontFamily.medium }}>
                  This week is based on your actual transactions.
                </Text>
              </View>
            </>
          ) : (
            <View style={{
              minHeight: 160,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: BorderRadius.md,
              borderWidth: 1,
              borderColor: colors.borderLight,
              backgroundColor: colors.surface,
              padding: Spacing.lg,
            }}>
              <MaterialCommunityIcons name="chart-bar" size={24} color={colors.textTertiary} />
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginTop: 8 }}>
                No spending recorded this week
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                Add a few transactions and this chart will show your real weekly pattern.
              </Text>
            </View>
          )}
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md }}>
            <MaterialCommunityIcons name="robot-outline" size={20} color={colors.primary} />
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>AI Insights</Text>
          </View>
          {insights.length > 0 ? (
            insights.map((insight, i) => (
              <View
                key={insight.id}
                style={{
                  flexDirection: 'row',
                  gap: Spacing.sm,
                  paddingVertical: Spacing.sm,
                  borderTopWidth: i > 0 ? 1 : 0,
                  borderTopColor: colors.borderLight,
                }}
              >
                <MaterialCommunityIcons
                  name={(insight.icon || 'lightbulb') as any}
                  size={18}
                  color={insight.type === 'warning' ? colors.accent : insight.type === 'achievement' ? colors.primaryLight : colors.primary}
                  style={{ marginTop: 2 }}
                />
                <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textPrimary, lineHeight: 20 }}>
                  {insight.message}
                </Text>
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: Spacing.sm, gap: 4 }}>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textPrimary, lineHeight: 20 }}>
                Add transactions to unlock personalized insights.
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                Until then, we’ll keep this section quiet instead of guessing.
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
