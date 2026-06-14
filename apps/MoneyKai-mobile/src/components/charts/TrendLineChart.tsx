import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { endOfWeek, format, isWithinInterval, startOfWeek, subWeeks } from 'date-fns';
import Svg, { Circle, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { Typography, Spacing } from '../../constants/theme';
import { useTransactionStore } from '../../stores/useTransactionStore';

type ChartPoint = {
  value: number;
  label: string;
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

const makeDataPoints = (transactions: { amount: number; transaction_date: string; type: string }[], weekStarts: Date[], labels?: string[]): ChartPoint[] =>
  weekStarts.map((weekStart, index) => ({
    value: sumForWeek(transactions, weekStart),
    label: labels?.[index] ?? format(weekStart, 'd MMM'),
  }));

export const TrendLineChart: React.FC = () => {
  const { colors } = useTheme();
  const transactions = useTransactionStore((s) => s.transactions);

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

  const chartWidth = 300;
  const chartHeight = 170;
  const padding = { top: 12, right: 12, bottom: 28, left: 42 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...weeklyTrend.current.map((point) => point.value), ...weeklyTrend.previous.map((point) => point.value));

  const toPoint = (point: ChartPoint, index: number) => {
    const x = padding.left + (plotWidth / Math.max(1, weeklyTrend.current.length - 1)) * index;
    const y = padding.top + plotHeight - (point.value / maxValue) * plotHeight;
    return { x, y };
  };

  const buildPolyline = (points: ChartPoint[]) =>
    points.map((point, index) => {
      const position = toPoint(point, index);
      return `${position.x},${position.y}`;
    }).join(' ');

  const currentPolyline = buildPolyline(weeklyTrend.current);
  const previousPolyline = buildPolyline(weeklyTrend.previous);
  const currentArea = `${padding.left},${padding.top + plotHeight} ${currentPolyline} ${padding.left + plotWidth},${padding.top + plotHeight}`;

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
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
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
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
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            No spending history yet
          </Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center', maxWidth: 240 }}>
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

          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            {[0, 1, 2, 3].map((section) => {
              const y = padding.top + (plotHeight / 3) * section;
              const label = Math.round(maxValue - (maxValue / 3) * section);
              return (
                <React.Fragment key={section}>
                  <Line x1={padding.left} y1={y} x2={padding.left + plotWidth} y2={y} stroke={colors.borderLight} strokeWidth={1} />
                  <SvgText x={padding.left - 8} y={y + 4} fill={colors.textTertiary} fontSize={9} textAnchor="end">
                    {label}
                  </SvgText>
                </React.Fragment>
              );
            })}
            <Polygon points={currentArea} fill={`${colors.primary}18`} />
            <Polyline points={previousPolyline} fill="none" stroke={colors.textTertiary} strokeWidth={2} strokeDasharray="5 4" />
            <Polyline points={currentPolyline} fill="none" stroke={colors.primary} strokeWidth={2.5} />
            {weeklyTrend.current.map((point, index) => {
              const current = toPoint(point, index);
              const previous = toPoint(weeklyTrend.previous[index], index);
              return (
                <React.Fragment key={point.label}>
                  <Circle cx={previous.x} cy={previous.y} r={3} fill={colors.textTertiary} />
                  <Circle cx={current.x} cy={current.y} r={4} fill={colors.primary} stroke={colors.card} strokeWidth={2} />
                  <SvgText x={current.x} y={chartHeight - 8} fill={colors.textTertiary} fontSize={9} textAnchor="middle">
                    {point.label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </>
      )}
    </Card>
  );
};

export default TrendLineChart;
