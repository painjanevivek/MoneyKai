import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { addDays } from 'date-fns/addDays';
import { endOfDay } from 'date-fns/endOfDay';
import { isWithinInterval } from 'date-fns/isWithinInterval';
import { startOfWeek } from 'date-fns/startOfWeek';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { getCategoryById } from '../../constants/categories';
import { calculateBudgetHealth, getBudgetHealthColor } from '../../utils/savingsEngine';
import { generateInsights } from '../../utils/insightEngine';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';

export const SavingsAnalyticsSnapshot: React.FC = () => {
  const { colors } = useTheme();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const transactions = useTransactionStore((s) => s.transactions);
  const settings = useBudgetStore((s) => s.settings);

  const health = calculateBudgetHealth(settings.monthly_allowance, totalSpent);
  const healthColor = getBudgetHealthColor(health.level, colors);
  const insights = generateInsights(settings.monthly_allowance, totalSpent, categoryTotals);
  const remaining = settings.monthly_allowance - totalSpent;
  const savingsRate = settings.monthly_allowance > 0 ? (remaining / settings.monthly_allowance) * 100 : 0;

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
  const chartWidth = 260;
  const chartHeight = 112;
  const barWidth = 20;
  const gap = 14;
  const maxWeeklyValue = Math.max(1, ...weeklyData.map((item) => item.value));

  return (
    <Card style={{ flex: 1 }}>
      <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>
        Analytics snapshot
      </Text>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: `${healthColor}18`, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: `${healthColor}90` }}>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: healthColor }}>{health.score}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: healthColor }}>{health.label}</Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>{health.message}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>Savings rate</Text>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            {Math.round(Math.max(0, savingsRate))}%
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: colors.borderLight }}>
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
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            {weeklyData.map((item, index) => {
              const height = Math.max(4, (item.value / maxWeeklyValue) * 78);
              const x = 18 + index * (barWidth + gap);
              const y = 84 - height;
              return (
                <React.Fragment key={`${item.label}-${index}`}>
                  <Rect x={x} y={y} width={barWidth} height={height} rx={6} fill={item.frontColor} />
                  <SvgText x={x + barWidth / 2} y={104} fill={colors.textSecondary} fontSize={9} textAnchor="middle">
                    {item.label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        ) : (
          <View style={{ minHeight: 96, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, padding: Spacing.md }}>
            <MaterialCommunityIcons name="chart-bar" size={20} color={colors.textTertiary} />
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 6 }}>No spending this week yet</Text>
          </View>
        )}
      </View>

      {insights.length > 0 && (
        <View style={{ gap: 6 }}>
          {insights.slice(0, 2).map((insight, index) => (
            <View key={insight.id} style={{ flexDirection: 'row', gap: 8, paddingTop: index > 0 ? 8 : 0, borderTopWidth: index > 0 ? 1 : 0, borderTopColor: colors.borderLight }}>
              <MaterialCommunityIcons
                name={(insight.icon || 'lightbulb-outline') as any}
                size={16}
                color={insight.type === 'warning' ? colors.accent : insight.type === 'achievement' ? colors.primaryLight : colors.primary}
                style={{ marginTop: 2 }}
              />
              <Text style={{ flex: 1, fontSize: Typography.fontSize.xs, color: colors.textPrimary, lineHeight: 18 }}>{insight.message}</Text>
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
