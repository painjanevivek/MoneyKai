import React from 'react';
import { Platform, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { endOfWeek } from 'date-fns/endOfWeek';
import { format } from 'date-fns/format';
import { isWithinInterval } from 'date-fns/isWithinInterval';
import { startOfWeek } from 'date-fns/startOfWeek';
import { subWeeks } from 'date-fns/subWeeks';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { BorderRadius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { convertFromInrForDisplay, formatCurrency } from '../../utils/formatCurrency';
import type { Transaction } from '../../types/transaction';

type ChartPoint = {
  value: number;
  label: string;
  customDataPoint?: () => React.ReactNode;
};

type TrendLineChartProps = {
  transactions?: Transaction[];
  title?: string;
  subtitle?: string;
};

const WEEK_START_OPTIONS = { weekStartsOn: 1 } as const;

const sumForWeek = (transactions: Pick<Transaction, 'amount' | 'transaction_date' | 'type'>[], weekStart: Date): number => {
  const weekEnd = endOfWeek(weekStart, WEEK_START_OPTIONS);
  return transactions.reduce((sum, transaction) => {
    if (transaction.type !== 'expense') {
      return sum;
    }

    const date = new Date(transaction.transaction_date);
    return isWithinInterval(date, { start: weekStart, end: weekEnd }) ? sum + transaction.amount : sum;
  }, 0);
};

const makeDataPoints = (
  transactions: Pick<Transaction, 'amount' | 'transaction_date' | 'type'>[],
  weekStarts: Date[],
  labels?: string[]
): ChartPoint[] =>
  weekStarts.map((weekStart, index) => ({
    value: sumForWeek(transactions, weekStart),
    label: labels?.[index] ?? format(weekStart, 'd MMM'),
  }));

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  transactions: transactionsProp,
  title = 'Spending Trend',
  subtitle = 'Last 5 Weeks',
}) => {
  const { colors, isDark } = useTheme();
  const storeTransactions = useTransactionStore((s) => s.transactions);
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);
  const transactions = transactionsProp ?? storeTransactions;
  const { width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const chartWidth = Math.min(Math.max(screenWidth - 80, 260), 342);
  const chartSpacing = Math.max(54, (chartWidth - 34) / 4);

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
    const currentTotal = current.reduce((sum, point) => sum + point.value, 0);
    const previousTotal = previous.reduce((sum, point) => sum + point.value, 0);

    return {
      current,
      previous,
      currentTotal,
      previousTotal,
      hasData: currentTotal > 0 || previousTotal > 0,
    };
  }, [transactions]);

  const currentData = weeklyTrend.current.map((item) => ({
    ...item,
    value: convertFromInrForDisplay(item.value),
    customDataPoint: isWeb
      ? () => (
          <View
            style={{
              width: 9,
              height: 9,
              borderRadius: 5,
              backgroundColor: colors.primary,
              borderWidth: 2,
              borderColor: isDark ? '#0D1210' : colors.card,
            }}
          />
        )
      : undefined,
  }));

  const previousData = weeklyTrend.previous.map((item) => ({
    ...item,
    value: convertFromInrForDisplay(item.value),
    customDataPoint: isWeb
      ? () => (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.textTertiary,
              borderWidth: 2,
              borderColor: isDark ? '#0D1210' : colors.card,
            }}
          />
        )
      : undefined,
  }));

  const comparison = weeklyTrend.currentTotal - weeklyTrend.previousTotal;
  const comparisonLabel =
    weeklyTrend.previousTotal <= 0
      ? 'New spending pattern'
      : comparison <= 0
        ? `${formatCurrency(Math.abs(comparison))} lower than previous period`
        : `${formatCurrency(comparison)} higher than previous period`;

  return (
    <Card
      variant="outlined"
      borderRadius="xl"
      style={{
        backgroundColor: isDark ? '#0D1210' : colors.card,
        borderColor: isDark ? '#26302B' : colors.borderLight,
        ...Shadows.md,
        shadowColor: colors.shadowColor,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: Typography.fontSize.xl,
              lineHeight: 28,
              fontFamily: Typography.fontFamily.display,
              color: colors.textPrimary,
            }}
          >
            {title}
          </Text>
          <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, lineHeight: 16, color: colors.textSecondary }}>
            {comparisonLabel}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${subtitle} spending trend`}
          activeOpacity={0.82}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#0A0E0C' : colors.surface,
            borderRadius: BorderRadius.sm,
            paddingHorizontal: 12,
            paddingVertical: 8,
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
            {subtitle}
          </Text>
        </TouchableOpacity>
      </View>

      {!weeklyTrend.hasData ? (
        <View
          style={{
            minHeight: 176,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: Spacing.lg,
            borderRadius: BorderRadius.lg,
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 24, height: 3, backgroundColor: colors.primary, borderRadius: 2 }} />
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>This Period</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 24, height: 3, backgroundColor: colors.textTertiary, borderRadius: 2, opacity: 0.55 }} />
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>Previous Period</Text>
            </View>
          </View>

          <LineChart
            data={currentData}
            data2={previousData}
            height={176}
            width={chartWidth}
            spacing={chartSpacing}
            initialSpacing={10}
            color1={colors.primary}
            color2={colors.textTertiary}
            dataPointsColor1={colors.primary}
            dataPointsColor2={colors.textTertiary}
            dataPointsRadius={4}
            thickness={3}
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
            startFillColor1={`${colors.primary}24`}
            endFillColor1={`${colors.primary}04`}
            startFillColor2={`${colors.textTertiary}12`}
            endFillColor2={`${colors.textTertiary}02`}
            noOfSections={3}
            yAxisLabelPrefix={`${currencySymbol} `}
          />
        </>
      )}
    </Card>
  );
};

export default TrendLineChart;
