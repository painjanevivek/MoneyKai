import React from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import {
  addDays,
  addHours,
  addMonths,
  differenceInCalendarMonths,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subHours,
  subMonths,
} from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { BorderRadius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useSettingsStore, type DashboardTrendMetric, type DashboardTrendRange } from '@/stores/useSettingsStore';
import { convertFromInrForDisplay } from '@/utils/formatCurrency';

type ChartPoint = {
  value: number;
  label: string;
  customDataPoint?: () => React.ReactNode;
};

type TransactionLike = {
  amount: number;
  transaction_date: string;
  type: string;
};

type Bucket = {
  start: Date;
  end: Date;
  label: string;
};

const RANGE_OPTIONS: { id: DashboardTrendRange; label: string; subtitle: string }[] = [
  { id: '1d', label: '1D', subtitle: 'Today by time blocks' },
  { id: '1w', label: '1 Week', subtitle: 'Daily movement' },
  { id: '1m', label: '1 Month', subtitle: 'Weekly movement' },
  { id: '3m', label: '3 Months', subtitle: 'Monthly movement' },
  { id: '6m', label: '6 Months', subtitle: 'Monthly movement' },
  { id: '1y', label: '1 Year', subtitle: 'Monthly movement' },
  { id: 'all', label: 'All Time', subtitle: 'Full available history' },
];

const METRIC_OPTIONS: {
  id: DashboardTrendMetric;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  unit: 'currency' | 'count';
}[] = [
  { id: 'spending', label: 'Spending Trend', icon: 'chart-line', unit: 'currency' },
  { id: 'income', label: 'Income Trend', icon: 'trending-up', unit: 'currency' },
  { id: 'netFlow', label: 'Net Flow', icon: 'swap-vertical', unit: 'currency' },
  { id: 'transactionCount', label: 'Transaction Count', icon: 'counter', unit: 'count' },
];

const getRangeLabel = (range: DashboardTrendRange) => RANGE_OPTIONS.find((option) => option.id === range)?.label ?? '1 Month';
const getMetricOption = (metric: DashboardTrendMetric) => METRIC_OPTIONS.find((option) => option.id === metric) ?? METRIC_OPTIONS[0];

const makeDailyBuckets = (start: Date, count: number): Bucket[] =>
  Array.from({ length: count }, (_, index) => {
    const day = addDays(start, index);
    return { start: startOfDay(day), end: endOfDay(day), label: format(day, 'd MMM') };
  });

const makeHourlyBuckets = (end: Date, count: number): Bucket[] => {
  const bucketHours = 24 / count;
  const start = subHours(end, 24);
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = addHours(start, index * bucketHours);
    const bucketEnd = index === count - 1 ? end : addHours(start, (index + 1) * bucketHours);
    return { start: bucketStart, end: bucketEnd, label: format(bucketStart, 'ha') };
  });
};

const makeIntervalBuckets = (start: Date, end: Date, count: number): Bucket[] => {
  const startMs = start.getTime();
  const interval = Math.max(1, (end.getTime() - startMs) / count);
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = new Date(startMs + interval * index);
    const bucketEnd = index === count - 1 ? end : new Date(startMs + interval * (index + 1));
    return { start: bucketStart, end: bucketEnd, label: format(bucketStart, 'd MMM') };
  });
};

const makeMonthlyBuckets = (start: Date, count: number): Bucket[] =>
  Array.from({ length: count }, (_, index) => {
    const month = addMonths(start, index);
    return { start: startOfMonth(month), end: endOfMonth(month), label: format(month, 'MMM') };
  });

const buildBuckets = (range: DashboardTrendRange, transactions: TransactionLike[]) => {
  const now = new Date();

  if (range === '1d') {
    const current = makeHourlyBuckets(now, 6);
    const previous = makeHourlyBuckets(subDays(now, 1), 6).map((bucket, index) => ({ ...bucket, label: current[index].label }));
    return { current, previous };
  }

  if (range === '1w') {
    const currentStart = startOfDay(subDays(now, 6));
    const current = makeDailyBuckets(currentStart, 7);
    const previous = makeDailyBuckets(subDays(currentStart, 7), 7).map((bucket, index) => ({ ...bucket, label: current[index].label }));
    return { current, previous };
  }

  if (range === '1m') {
    const currentStart = startOfDay(subDays(now, 29));
    const current = makeIntervalBuckets(currentStart, now, 5);
    const previousStart = subDays(currentStart, 30);
    const previous = makeIntervalBuckets(previousStart, currentStart, 5).map((bucket, index) => ({ ...bucket, label: current[index].label }));
    return { current, previous };
  }

  const monthCount =
    range === '3m' ? 3 :
    range === '6m' ? 6 :
    range === '1y' ? 12 :
    Math.max(
      1,
      Math.min(
        24,
        differenceInCalendarMonths(
          startOfMonth(now),
          startOfMonth(
            transactions.reduce((earliest, transaction) => {
              const date = new Date(transaction.transaction_date);
              return Number.isFinite(date.getTime()) && date < earliest ? date : earliest;
            }, now)
          )
        ) + 1
      )
    );

  const currentStart = startOfMonth(subMonths(now, monthCount - 1));
  const current = makeMonthlyBuckets(currentStart, monthCount);
  const previous = makeMonthlyBuckets(subMonths(currentStart, monthCount), monthCount).map((bucket, index) => ({ ...bucket, label: current[index].label }));
  return { current, previous };
};

const summarizeBucket = (transactions: TransactionLike[], bucket: Bucket, metric: DashboardTrendMetric): number => {
  return transactions.reduce(
    (summary, transaction) => {
      const date = new Date(transaction.transaction_date);
      if (!Number.isFinite(date.getTime()) || date < bucket.start || date > bucket.end) {
        return summary;
      }

      if (metric === 'transactionCount') {
        return summary + 1;
      }

      if (transaction.type === 'income') {
        return metric === 'income' || metric === 'netFlow' ? summary + transaction.amount : summary;
      }

      if (transaction.type === 'expense') {
        return metric === 'spending' ? summary + transaction.amount : metric === 'netFlow' ? summary - transaction.amount : summary;
      }

      return summary;
    },
    0
  );
};

const makeDataPoints = (transactions: TransactionLike[], buckets: Bucket[], metric: DashboardTrendMetric): ChartPoint[] =>
  buckets.map((bucket) => ({
    value: summarizeBucket(transactions, bucket, metric),
    label: bucket.label,
  }));

export const TrendLineChart: React.FC = () => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const transactions = useTransactionStore((s) => s.transactions);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const trendRange = useSettingsStore((state) => state.dashboardTrendRange);
  const trendMetric = useSettingsStore((state) => state.dashboardTrendMetric);
  const setDashboardTrendPreferences = useSettingsStore((state) => state.setDashboardTrendPreferences);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [metricMenuOpen, setMetricMenuOpen] = React.useState(false);
  const isWeb = Platform.OS === 'web';
  const metric = getMetricOption(trendMetric);

  const trend = React.useMemo(() => {
    const buckets = buildBuckets(trendRange, transactions);
    const current = makeDataPoints(transactions, buckets.current, trendMetric);
    const previous = makeDataPoints(transactions, buckets.previous, trendMetric);
    const hasData = current.some((point) => point.value !== 0) || previous.some((point) => point.value !== 0);
    return { current, previous, hasData };
  }, [transactions, trendMetric, trendRange]);

  const currentData = trend.current.map((item) => ({
    ...item,
    value: metric.unit === 'currency' ? convertFromInrForDisplay(item.value) : item.value,
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

  const previousData = trend.previous.map((item) => ({
    ...item,
    value: metric.unit === 'currency' ? convertFromInrForDisplay(item.value) : item.value,
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

  const renderChart = (chartWidth: number, chartHeight: number) => {
    const pointCount = Math.max(1, currentData.length);
    const spacing = Math.max(44, Math.min(chartWidth / Math.max(2, pointCount - 1), 92));

    if (!trend.hasData) {
      return (
        <View
          style={{
            minHeight: chartHeight,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: Spacing.lg,
            borderRadius: BorderRadius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <MaterialCommunityIcons name="chart-line-variant" size={28} color={colors.primary} />
          <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            No trend history yet
          </Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center', maxWidth: 260 }}>
            Add transactions to see this graph fill in for the selected range.
          </Text>
        </View>
      );
    }

    return (
      <LineChart
        data={currentData}
        data2={previousData}
        height={chartHeight}
        width={chartWidth}
        spacing={spacing}
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
        yAxisTextStyle={{ fontSize: 10, color: colors.textTertiary, fontFamily: Typography.fontFamily.regular }}
        xAxisLabelTextStyle={{ fontSize: 10, color: colors.textTertiary, fontFamily: Typography.fontFamily.regular }}
        curved
        areaChart
        startFillColor1={`${colors.primary}20`}
        endFillColor1={`${colors.primary}05`}
        startFillColor2={`${colors.textTertiary}10`}
        endFillColor2={`${colors.textTertiary}02`}
        noOfSections={3}
        yAxisLabelPrefix={metric.unit === 'currency' ? `${currencySymbol} ` : ''}
      />
    );
  };

  const dashboardChartWidth = Math.max(280, Math.min(width < 1280 ? width - 104 : 520, 620));
  const modalChartWidth = Math.max(520, Math.min(width - 160, 980));
  const modalMaxHeight = Math.max(520, Math.min(height - 96, 760));

  return (
    <>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              {metric.label}
            </Text>
            <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
              {getRangeLabel(trendRange)} compared with previous period
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose trend graph"
              onPress={() => setModalVisible(true)}
              style={({ hovered, pressed }: any) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
                borderRadius: BorderRadius.sm,
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderWidth: 1,
                borderColor: hovered ? `${colors.primary}40` : colors.glassBorder,
                transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
              })}
            >
              <MaterialCommunityIcons name={metric.icon} size={16} color={colors.primary} />
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                {getRangeLabel(trendRange)}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open spending trend fullscreen"
              onPress={() => setModalVisible(true)}
              style={({ hovered, pressed }: any) => ({
                width: 34,
                height: 34,
                borderRadius: BorderRadius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
                borderWidth: 1,
                borderColor: hovered ? `${colors.primary}40` : colors.glassBorder,
                transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
              })}
            >
              <MaterialCommunityIcons name="arrow-expand-all" size={16} color={colors.primary} />
            </Pressable>
          </View>
        </View>

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

        {renderChart(dashboardChartWidth, 150)}
      </Card>

      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, backgroundColor: colors.overlay }}>
          <Pressable
            accessibilityLabel="Close trend graph"
            onPress={() => setModalVisible(false)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />

          <View
            style={{
              width: '100%',
              maxWidth: 1120,
              maxHeight: modalMaxHeight,
              borderRadius: BorderRadius['2xl'],
              backgroundColor: colors.glassBg,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              padding: Spacing.xl,
              gap: Spacing.lg,
              ...Shadows.lg,
              shadowColor: colors.shadowColor,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                  {metric.label}
                </Text>
                <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                  Choose a range and graph type for the dashboard trend.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close trend graph"
                onPress={() => setModalVisible(false)}
                style={({ hovered }: any) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                })}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.md, position: 'relative', zIndex: 10 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
                {RANGE_OPTIONS.map((option) => {
                  const active = trendRange === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setDashboardTrendPreferences({ dashboardTrendRange: option.id })}
                      style={({ hovered }: any) => ({
                        minWidth: 96,
                        paddingHorizontal: Spacing.md,
                        paddingVertical: 10,
                        borderRadius: BorderRadius.md,
                        backgroundColor: active ? colors.primary : hovered ? `${colors.primary}12` : colors.surface,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.glassBorder,
                      })}
                    >
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: active ? colors.textInverse : colors.textPrimary }}>
                        {option.label}
                      </Text>
                      <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: active ? colors.textInverse : colors.textTertiary }} numberOfLines={1}>
                        {option.subtitle}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={{ position: 'relative', minWidth: 220 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose graph type"
                  accessibilityState={{ expanded: metricMenuOpen }}
                  onPress={() => setMetricMenuOpen((current) => !current)}
                  style={({ hovered }: any) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: Spacing.sm,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 11,
                    borderRadius: BorderRadius.md,
                    backgroundColor: hovered ? colors.surfaceElevated : colors.surface,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <MaterialCommunityIcons name={metric.icon} size={18} color={colors.primary} />
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {metric.label}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} />
                </Pressable>

                {metricMenuOpen ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 50,
                      right: 0,
                      width: 260,
                      borderRadius: BorderRadius.md,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.glassBorder,
                      padding: Spacing.xs,
                      gap: 4,
                      zIndex: 20,
                      ...Shadows.lg,
                      shadowColor: colors.shadowColor,
                    }}
                  >
                    {METRIC_OPTIONS.map((option) => {
                      const active = trendMetric === option.id;
                      return (
                        <Pressable
                          key={option.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => {
                            setDashboardTrendPreferences({ dashboardTrendMetric: option.id });
                            setMetricMenuOpen(false);
                          }}
                          style={({ hovered }: any) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: Spacing.sm,
                            borderRadius: BorderRadius.sm,
                            paddingHorizontal: Spacing.sm,
                            paddingVertical: 10,
                            backgroundColor: active ? colors.primaryBg : hovered ? `${colors.primary}10` : 'transparent',
                          })}
                        >
                          <MaterialCommunityIcons name={option.icon} size={18} color={active ? colors.primary : colors.textSecondary} />
                          <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                            {option.label}
                          </Text>
                          {active ? <MaterialCommunityIcons name="check" size={16} color={colors.primary} /> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 16, height: 2, backgroundColor: colors.primary, borderRadius: 1 }} />
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>This Period</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 16, height: 2, backgroundColor: colors.textTertiary, borderRadius: 1, opacity: 0.5 }} />
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>Previous Period</Text>
              </View>
            </View>

            <View style={{ overflow: 'hidden', borderRadius: BorderRadius.lg }}>
              {renderChart(modalChartWidth, Math.max(240, Math.min(360, modalMaxHeight - 310)))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default TrendLineChart;
