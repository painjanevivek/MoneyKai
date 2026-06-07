import React from 'react';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import { endOfWeek, format, isWithinInterval, startOfWeek, subWeeks } from 'date-fns';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { Typography, Spacing } from '../../constants/theme';
import { useTransactionStore } from '../../stores/useTransactionStore';

type ChartPoint = {
  value: number;
  label: string;
  customDataPoint?: () => React.ReactNode;
};

const WEEK_START_OPTIONS = { weekStartsOn: 1 } as const;

const sumForWeek = (transactions: { amount: number; transaction_date: string; type: string }[], weekStart: Date): number => {
  const weekEnd = endOfWeek(weekStart, WEEK_START_OPTIONS);
  return transactions.reduce((sum, transaction) => {
    if (transaction.type !== 'expense') {
      return sum;
    }
    const date = new Date(transaction.transaction_date);
    return isWithinInterval(date, { start: weekStart, end: weekEnd }) ? sum + transaction.amount : sum;
  }, 0);
};

const makeDataPoints = (transactions: { amount: number; transaction_date: string; type: string }[], weekStarts: Date[], labels?: string[]): ChartPoint[] => {
  return weekStarts.map((weekStart, index) => ({
    value: sumForWeek(transactions, weekStart),
    label: labels?.[index] ?? format(weekStart, 'd MMM'),
  }));
};

export const TrendLineChart: React.FC = () => {
  const { colors } = useTheme();
  const transactions = useTransactionStore((s) => s.transactions);
  const isWeb = Platform.OS === 'web';

  const weeklyTrend = React.useMemo(() => {
    const now = new Date();
    const currentWeekStarts = Array.from({ length: 5 }, (_, index) =>
      startOfWeek(subWeeks(now, 4 - index), WEEK_START_OPTIONS)
    );
    const previousWeekStarts = Array.from({ length: 5 }, (_, index) =>
      startOfWeek(subWeeks(now, 9 - index), WEEK_START_OPTIONS)
    );

    const current = makeDataPoints(transactions, currentWeekStarts);
    const previous = makeDataPoints(transactions, previousWeekStarts, current.map((point) => point.label));

    const hasData = current.some((point) => point.value > 0) || previous.some((point) => point.value > 0);

    return { current, previous, hasData };
  }, [transactions]);

  const currentData = weeklyTrend.current.map((item) => ({
    ...item,
    customDataPoint: isWeb
      ? () => (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.primary,
              borderWidth: 2,
              borderColor: colors.background,
            }}
          />
        )
      : undefined,
  }));

  const previousData = weeklyTrend.previous.map((item) => ({
    ...item,
    customDataPoint: isWeb
      ? () => (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.textTertiary,
              borderWidth: 2,
              borderColor: colors.background,
            }}
          />
        )
      : undefined,
  }));

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text
          style={{
            fontSize: Typography.fontSize.md,
            fontFamily: Typography.fontFamily.semiBold,
            color: colors.textPrimary,
          }}
        >
          Spending Trend
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.xs,
              fontFamily: Typography.fontFamily.medium,
              color: colors.textSecondary,
            }}
          >
            Last 5 Weeks
          </Text>
        </TouchableOpacity>
      </View>

      {!weeklyTrend.hasData ? (
        <View
          style={{
            minHeight: 160,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: Spacing.lg,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.semiBold,
              color: colors.textPrimary,
            }}
          >
            No spending history yet
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: Typography.fontSize.xs,
              color: colors.textSecondary,
              textAlign: 'center',
              maxWidth: 240,
            }}
          >
            Add your first transaction to see a real trend here.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 16, height: 2, backgroundColor: colors.primary, borderRadius: 1 }} />
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>This Period</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 16, height: 2, backgroundColor: colors.textTertiary, borderRadius: 1, opacity: 0.5 }} />
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>Previous Period</Text>
            </View>
          </View>

          <LineChart
            data={currentData}
            data2={previousData}
            height={150}
            width={280}
            spacing={65}
            initialSpacing={10}
            color1={colors.primary}
            color2={colors.textTertiary}
            dataPointsColor1={colors.primary}
            dataPointsColor2={colors.textTertiary}
            dataPointsRadius={4}
            thickness={2}
            thickness2={2}
            hideRules
            yAxisColor="transparent"
            xAxisColor={colors.borderLight}
            yAxisTextStyle={{
              fontSize: 10,
              color: colors.textTertiary,
              fontFamily: Typography.fontFamily.regular,
            }}
            xAxisLabelTextStyle={{
              fontSize: 10,
              color: colors.textTertiary,
              fontFamily: Typography.fontFamily.regular,
            }}
            curved
            areaChart
            startFillColor1={`${colors.primary}20`}
            endFillColor1={`${colors.primary}05`}
            startFillColor2={`${colors.textTertiary}10`}
            endFillColor2={`${colors.textTertiary}02`}
            noOfSections={3}
            yAxisLabelPrefix="₹ "
          />
        </>
      )}
    </Card>
  );
};

export default TrendLineChart;
