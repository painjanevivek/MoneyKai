import React from 'react';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
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
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { BorderRadius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useTransactionStore } from '../../stores/useTransactionStore';
import {
  useSettingsStore,
  type DashboardTrendChartType,
  type DashboardTrendMetric,
  type DashboardTrendRange,
} from '@/stores/useSettingsStore';
import { convertFromInrForDisplay } from '@/utils/formatCurrency';

type ChartPoint = {
  value: number;
  label: string;
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

type ChartSize = {
  width: number;
  height: number;
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

const CHART_TYPE_OPTIONS: {
  id: DashboardTrendChartType;
  label: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { id: 'line', label: 'Line Chart', subtitle: 'Monitor changes over time', icon: 'chart-line' },
  { id: 'bar', label: 'Bar Chart', subtitle: 'Compare periods and buckets', icon: 'chart-bar' },
  { id: 'donut', label: 'Donut Chart', subtitle: 'Part-to-whole breakdown', icon: 'chart-donut' },
];

const getRangeLabel = (range: DashboardTrendRange) => RANGE_OPTIONS.find((option) => option.id === range)?.label ?? '1 Month';
const getMetricOption = (metric: DashboardTrendMetric) => METRIC_OPTIONS.find((option) => option.id === metric) ?? METRIC_OPTIONS[0];
const getChartTypeOption = (chartType: DashboardTrendChartType) => CHART_TYPE_OPTIONS.find((option) => option.id === chartType) ?? CHART_TYPE_OPTIONS[0];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

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
    range === '3m'
      ? 3
      : range === '6m'
        ? 6
        : range === '1y'
          ? 12
          : Math.max(
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
  return transactions.reduce((summary, transaction) => {
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
  }, 0);
};

const makeDataPoints = (transactions: TransactionLike[], buckets: Bucket[], metric: DashboardTrendMetric): ChartPoint[] =>
  buckets.map((bucket) => ({
    value: summarizeBucket(transactions, bucket, metric),
    label: bucket.label,
  }));

const formatAxisValue = (value: number, unit: 'currency' | 'count', currencySymbol: string) => {
  const absolute = Math.abs(value);
  const compact =
    absolute >= 100000 ? `${Math.round(value / 1000)}k` :
    absolute >= 10000 ? `${Math.round(value / 100) / 10}k` :
    absolute >= 1000 ? `${Math.round(value)}` :
    Number.isInteger(value) ? `${value}` : `${Math.round(value * 10) / 10}`;
  return unit === 'currency' ? `${currencySymbol} ${compact}` : compact;
};

const buildLinePath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
};

const buildDonutArc = (cx: number, cy: number, outerRadius: number, innerRadius: number, startAngle: number, endAngle: number) => {
  const startOuter = {
    x: cx + outerRadius * Math.cos(startAngle),
    y: cy + outerRadius * Math.sin(startAngle),
  };
  const endOuter = {
    x: cx + outerRadius * Math.cos(endAngle),
    y: cy + outerRadius * Math.sin(endAngle),
  };
  const startInner = {
    x: cx + innerRadius * Math.cos(endAngle),
    y: cy + innerRadius * Math.sin(endAngle),
  };
  const endInner = {
    x: cx + innerRadius * Math.cos(startAngle),
    y: cy + innerRadius * Math.sin(startAngle),
  };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
};

const TrendLegend = () => {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 16, height: 2, backgroundColor: colors.primary, borderRadius: 1 }} />
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>This Period</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 16, height: 2, backgroundColor: colors.textTertiary, borderRadius: 1, opacity: 0.55 }} />
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>Previous Period</Text>
      </View>
    </View>
  );
};

function TrendSvgChart({
  chartType,
  currentData,
  previousData,
  hasData,
  metricUnit,
  currencySymbol,
  size,
  compact = false,
}: {
  chartType: DashboardTrendChartType;
  currentData: ChartPoint[];
  previousData: ChartPoint[];
  hasData: boolean;
  metricUnit: 'currency' | 'count';
  currencySymbol: string;
  size: ChartSize;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const width = Math.max(260, size.width);
  const height = Math.max(compact ? 170 : 320, size.height);
  const padding = {
    top: compact ? 16 : 22,
    right: compact ? 14 : 26,
    bottom: compact ? 36 : 48,
    left: compact ? 54 : 74,
  };
  const plotWidth = Math.max(120, width - padding.left - padding.right);
  const plotHeight = Math.max(80, height - padding.top - padding.bottom);
  const values = [...currentData, ...previousData].map((point) => point.value);
  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(0, ...values);
  const span = rawMax - rawMin || 1;
  const minY = rawMin - span * 0.08;
  const maxY = rawMax + span * 0.1;
  const yForValue = (value: number) => padding.top + ((maxY - value) / (maxY - minY || 1)) * plotHeight;
  const xForIndex = (index: number, total: number) =>
    padding.left + (total <= 1 ? plotWidth / 2 : (plotWidth * index) / (total - 1));
  const axisTicks = [0, 0.5, 1].map((ratio) => maxY - (maxY - minY) * ratio);
  const labelEvery = compact ? Math.max(1, Math.ceil(currentData.length / 4)) : Math.max(1, Math.ceil(currentData.length / 7));

  if (!hasData) {
    return (
      <View
        style={{
          height,
          alignItems: 'center',
          justifyContent: 'center',
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

  if (chartType === 'donut') {
    const donutValues = currentData.map((point) => Math.abs(point.value)).filter((value) => value > 0);
    const total = donutValues.reduce((sum, value) => sum + value, 0);
    const cx = width / 2;
    const cy = height / 2 - (compact ? 6 : 4);
    const outerRadius = Math.min(width, height) * (compact ? 0.28 : 0.31);
    const innerRadius = outerRadius * 0.62;
    let cursor = -Math.PI / 2;

    return (
      <View style={{ height, overflow: 'hidden', borderRadius: BorderRadius.lg }}>
        <Svg width={width} height={height}>
          <Circle cx={cx} cy={cy} r={outerRadius} fill={`${colors.primary}10`} />
          {currentData.map((point, index) => {
            const value = Math.abs(point.value);
            if (value <= 0 || total <= 0) return null;
            const angle = (value / total) * Math.PI * 2;
            const path = buildDonutArc(cx, cy, outerRadius, innerRadius, cursor, cursor + angle);
            cursor += angle;
            const palette = [colors.primary, colors.chart2, colors.chart3, colors.chart4, colors.chart6, colors.chart8];
            return <Path key={`${point.label}-${index}`} d={path} fill={palette[index % palette.length]} opacity={0.95} />;
          })}
          <Circle cx={cx} cy={cy} r={innerRadius} fill={colors.glassBg} />
          <SvgText x={cx} y={cy - 4} fill={colors.textSecondary} fontSize={compact ? 10 : 12} fontWeight="600" textAnchor="middle">
            Total
          </SvgText>
          <SvgText x={cx} y={cy + 18} fill={colors.textPrimary} fontSize={compact ? 14 : 18} fontWeight="700" textAnchor="middle">
            {formatAxisValue(total, metricUnit, currencySymbol)}
          </SvgText>
          {currentData.slice(0, compact ? 3 : 6).map((point, index) => (
            <G key={`legend-${point.label}`} x={padding.left} y={height - padding.bottom + index * 0}>
              {compact ? null : (
                <>
                  <Circle cx={index % 3 === 0 ? 0 : index % 3 === 1 ? plotWidth * 0.36 : plotWidth * 0.68} cy={22 + Math.floor(index / 3) * 18} r={4} fill={[colors.primary, colors.chart2, colors.chart3, colors.chart4, colors.chart6, colors.chart8][index % 6]} />
                  <SvgText x={(index % 3 === 0 ? 10 : index % 3 === 1 ? plotWidth * 0.36 + 10 : plotWidth * 0.68 + 10)} y={26 + Math.floor(index / 3) * 18} fill={colors.textTertiary} fontSize={11}>
                    {point.label}
                  </SvgText>
                </>
              )}
            </G>
          ))}
        </Svg>
      </View>
    );
  }

  const currentCoordinates = currentData.map((point, index) => ({
    x: xForIndex(index, currentData.length),
    y: yForValue(point.value),
  }));
  const previousCoordinates = previousData.map((point, index) => ({
    x: xForIndex(index, previousData.length),
    y: yForValue(point.value),
  }));
  const zeroY = clamp(yForValue(0), padding.top, padding.top + plotHeight);

  return (
    <View style={{ height, overflow: 'hidden', borderRadius: BorderRadius.lg }}>
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} rx={14} fill="transparent" />
        {axisTicks.map((tick, index) => {
          const y = yForValue(tick);
          return (
            <G key={`tick-${index}`}>
              <Line x1={padding.left} y1={y} x2={padding.left + plotWidth} y2={y} stroke={colors.borderLight} strokeWidth={1} opacity={0.42} />
              <SvgText x={padding.left - 10} y={y + 4} fill={colors.textTertiary} fontSize={compact ? 10 : 11} textAnchor="end">
                {formatAxisValue(tick, metricUnit, currencySymbol)}
              </SvgText>
            </G>
          );
        })}
        <Line x1={padding.left} y1={zeroY} x2={padding.left + plotWidth} y2={zeroY} stroke={colors.border} strokeWidth={1.3} />
        <Line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotHeight} stroke={colors.borderLight} strokeWidth={1} opacity={0.38} />

        {chartType === 'bar' ? (
          <>
            {currentData.map((point, index) => {
              const groupWidth = plotWidth / Math.max(1, currentData.length);
              const barWidth = Math.max(7, Math.min(20, groupWidth * 0.28));
              const x = padding.left + groupWidth * index + groupWidth / 2 - barWidth - 2;
              const y = Math.min(yForValue(point.value), zeroY);
              const barHeight = Math.max(2, Math.abs(zeroY - yForValue(point.value)));
              const previous = previousData[index];
              const previousY = previous ? Math.min(yForValue(previous.value), zeroY) : zeroY;
              const previousHeight = previous ? Math.max(2, Math.abs(zeroY - yForValue(previous.value))) : 0;
              return (
                <G key={`${point.label}-${index}`}>
                  {previous ? (
                    <Rect x={x + barWidth + 4} y={previousY} width={barWidth} height={previousHeight} rx={4} fill={colors.textTertiary} opacity={0.36} />
                  ) : null}
                  <Rect x={x} y={y} width={barWidth} height={barHeight} rx={4} fill={colors.primary} opacity={0.92} />
                </G>
              );
            })}
          </>
        ) : (
          <>
            <Path d={buildLinePath(previousCoordinates)} fill="none" stroke={colors.textTertiary} strokeWidth={2.2} opacity={0.38} />
            <Path d={buildLinePath(currentCoordinates)} fill="none" stroke={colors.primary} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
            {currentCoordinates.map((point, index) => (
              <Circle key={`current-${index}`} cx={point.x} cy={point.y} r={3.8} fill={colors.primary} stroke={colors.background} strokeWidth={1.5} />
            ))}
            {previousCoordinates.map((point, index) => (
              <Circle key={`previous-${index}`} cx={point.x} cy={point.y} r={3.2} fill={colors.textTertiary} stroke={colors.background} strokeWidth={1.2} opacity={0.55} />
            ))}
          </>
        )}

        {currentData.map((point, index) => {
          if (index % labelEvery !== 0 && index !== currentData.length - 1) return null;
          const x = xForIndex(index, currentData.length);
          return (
            <SvgText key={`label-${point.label}-${index}`} x={x} y={height - 14} fill={colors.textTertiary} fontSize={compact ? 10 : 11} textAnchor="middle">
              {point.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

function FilterDropdown({
  label,
  value,
  icon,
  expanded,
  onPress,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  expanded: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ hovered }: any) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        borderRadius: BorderRadius.md,
        backgroundColor: hovered ? colors.surfaceElevated : colors.surface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, minWidth: 0 }}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{label}</Text>
          <Text numberOfLines={1} style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            {value}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

export const TrendLineChart: React.FC = () => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const transactions = useTransactionStore((s) => s.transactions);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const trendRange = useSettingsStore((state) => state.dashboardTrendRange);
  const trendMetric = useSettingsStore((state) => state.dashboardTrendMetric);
  const trendChartType = useSettingsStore((state) => state.dashboardTrendChartType);
  const setDashboardTrendPreferences = useSettingsStore((state) => state.setDashboardTrendPreferences);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [metricMenuOpen, setMetricMenuOpen] = React.useState(false);
  const [chartTypeMenuOpen, setChartTypeMenuOpen] = React.useState(false);
  const [dashboardChartSize, setDashboardChartSize] = React.useState<ChartSize>({ width: 360, height: 172 });
  const [modalChartSize, setModalChartSize] = React.useState<ChartSize>({ width: 760, height: 430 });
  const metric = getMetricOption(trendMetric);
  const chartType = getChartTypeOption(trendChartType);
  const modalWide = width >= 1080;
  const modalMaxHeight = Math.max(560, Math.min(height - 72, 820));

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
  }));

  const previousData = trend.previous.map((item) => ({
    ...item,
    value: metric.unit === 'currency' ? convertFromInrForDisplay(item.value) : item.value,
  }));

  const closeMenus = () => {
    setMetricMenuOpen(false);
    setChartTypeMenuOpen(false);
  };

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
              accessibilityLabel="Choose trend graph filters"
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
              <MaterialCommunityIcons name={chartType.icon} size={16} color={colors.primary} />
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                {getRangeLabel(trendRange)}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open trend graph fullscreen"
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

        <TrendLegend />

        <View
          onLayout={(event) => {
            const nextWidth = Math.floor(event.nativeEvent.layout.width);
            if (nextWidth > 0 && Math.abs(nextWidth - dashboardChartSize.width) > 2) {
              setDashboardChartSize({ width: nextWidth, height: 172 });
            }
          }}
          style={{ marginTop: Spacing.sm, overflow: 'hidden', borderRadius: BorderRadius.lg }}
        >
          <TrendSvgChart
            chartType={trendChartType}
            currentData={currentData}
            previousData={previousData}
            hasData={trend.hasData}
            metricUnit={metric.unit}
            currencySymbol={currencySymbol}
            size={dashboardChartSize}
            compact
          />
        </View>
      </Card>

      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, backgroundColor: colors.overlay }}>
          <Pressable
            accessibilityLabel="Close trend graph"
            onPress={() => {
              closeMenus();
              setModalVisible(false);
            }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />

          <View
            style={{
              width: '100%',
              maxWidth: 1220,
              maxHeight: modalMaxHeight,
              borderRadius: BorderRadius['2xl'],
              backgroundColor: colors.glassBg,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              padding: modalWide ? Spacing.xl : Spacing.base,
              gap: Spacing.lg,
              overflow: 'hidden',
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
                  Choose a range, metric, and graph type for the dashboard trend.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close trend graph"
                onPress={() => {
                  closeMenus();
                  setModalVisible(false);
                }}
                style={({ hovered }: any) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                })}
              >
                <MaterialCommunityIcons name="close" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={{ flexDirection: modalWide ? 'row' : 'column', gap: Spacing.lg, minHeight: modalWide ? 0 : undefined }}>
              <View style={{ flex: 1, minWidth: 0, gap: Spacing.md }}>
                <TrendLegend />
                <View
                  onLayout={(event) => {
                    const nextWidth = Math.floor(event.nativeEvent.layout.width);
                    const nextHeight = Math.floor(event.nativeEvent.layout.height);
                    if (nextWidth > 0 && nextHeight > 0 && (Math.abs(nextWidth - modalChartSize.width) > 2 || Math.abs(nextHeight - modalChartSize.height) > 2)) {
                      setModalChartSize({ width: nextWidth, height: nextHeight });
                    }
                  }}
                  style={{
                    minHeight: modalWide ? 430 : 320,
                    maxHeight: modalWide ? modalMaxHeight - 164 : 360,
                    flex: modalWide ? 1 : undefined,
                    overflow: 'hidden',
                    borderRadius: BorderRadius.xl,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    backgroundColor: 'rgba(0,0,0,0.04)',
                  }}
                >
                  <TrendSvgChart
                    chartType={trendChartType}
                    currentData={currentData}
                    previousData={previousData}
                    hasData={trend.hasData}
                    metricUnit={metric.unit}
                    currencySymbol={currencySymbol}
                    size={modalChartSize}
                  />
                </View>
              </View>

              <View
                style={{
                  width: modalWide ? 330 : '100%',
                  gap: Spacing.md,
                  padding: Spacing.md,
                  borderRadius: BorderRadius.xl,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  backgroundColor: colors.glassBg,
                  alignSelf: modalWide ? 'stretch' : 'auto',
                  position: 'relative',
                  zIndex: 10,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                  Filters
                </Text>

                <View style={{ gap: Spacing.sm }}>
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                    Range
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                    {RANGE_OPTIONS.map((option) => {
                      const active = trendRange === option.id;
                      return (
                        <Pressable
                          key={option.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => setDashboardTrendPreferences({ dashboardTrendRange: option.id })}
                          style={({ hovered }: any) => ({
                            width: modalWide ? '48%' : undefined,
                            minWidth: modalWide ? undefined : 128,
                            flexGrow: modalWide ? 0 : 1,
                            paddingHorizontal: Spacing.sm,
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
                  </View>
                </View>

                <View style={{ gap: Spacing.sm, position: 'relative', zIndex: 30 }}>
                  <FilterDropdown
                    label="Graph type"
                    value={chartType.label}
                    icon={chartType.icon}
                    expanded={chartTypeMenuOpen}
                    onPress={() => {
                      setMetricMenuOpen(false);
                      setChartTypeMenuOpen((current) => !current);
                    }}
                  />
                  {chartTypeMenuOpen ? (
                    <View
                      style={{
                        borderRadius: BorderRadius.md,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.glassBorder,
                        padding: Spacing.xs,
                        gap: 4,
                      }}
                    >
                      {CHART_TYPE_OPTIONS.map((option) => {
                        const active = trendChartType === option.id;
                        return (
                          <Pressable
                            key={option.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() => {
                              setDashboardTrendPreferences({ dashboardTrendChartType: option.id });
                              setChartTypeMenuOpen(false);
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
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                                {option.label}
                              </Text>
                              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }} numberOfLines={1}>
                                {option.subtitle}
                              </Text>
                            </View>
                            {active ? <MaterialCommunityIcons name="check" size={16} color={colors.primary} /> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>

                <View style={{ gap: Spacing.sm, position: 'relative', zIndex: 20 }}>
                  <FilterDropdown
                    label="Metric"
                    value={metric.label}
                    icon={metric.icon}
                    expanded={metricMenuOpen}
                    onPress={() => {
                      setChartTypeMenuOpen(false);
                      setMetricMenuOpen((current) => !current);
                    }}
                  />
                  {metricMenuOpen ? (
                    <View
                      style={{
                        borderRadius: BorderRadius.md,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.glassBorder,
                        padding: Spacing.xs,
                        gap: 4,
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
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default TrendLineChart;
