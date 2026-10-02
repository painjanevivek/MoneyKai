import React, { useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { buildDashboardGraph, getGraphRangeLabel, GRAPH_METRIC_OPTIONS, GRAPH_TYPE_OPTIONS, type DashboardGraphView, type GraphTransactionContext } from '@/utils/dashboardGraph';
import { formatCurrency } from '@/utils/formatCurrency';
import { DashboardGraphPlot } from './DashboardGraphPlot';
import { GraphBreakdown } from './GraphBreakdown';
import { getGraphBucketCapacity } from '@/utils/graphPeriods';

type GraphAction = { kind: 'graphs'; onPress: () => void } | { kind: 'transactions'; onPress: (context: GraphTransactionContext) => void };
type Props = { now: Date; compact?: boolean; view?: DashboardGraphView; graphAction: GraphAction; onConfigure?: () => void };

export function DashboardTrendCard({ now, compact = false, view, graphAction, onConfigure }: Props) {
  const { colors } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const [details, setDetails] = useState(false);
  const [cardWidth, setCardWidth] = useState(width - Spacing.xl * 2);
  const transactions = useTransactionStore((state) => state.transactions);
  const savedRange = useSettingsStore((state) => state.dashboardTrendRange);
  const savedMetric = useSettingsStore((state) => state.dashboardTrendMetric);
  const savedType = useSettingsStore((state) => state.dashboardTrendChartType);
  const { range, metric, type } = view ?? { range: savedRange, metric: savedMetric, type: savedType };
  const [page, setPage] = useState({ range, offset: 0 });
  const pageOffset = page.range === range ? page.offset : 0;
  const minimumPeriods = !compact && (range === '1m' || range === 'all') ? 3 : 1;
  const bucketCount = Math.max(minimumPeriods, getGraphBucketCapacity(cardWidth - (compact ? Spacing.md : Spacing.lg) * 2, fontScale, range));
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  useSettingsStore((state) => state.currency);
  useSettingsStore((state) => state.exchangeRates);
  const data = useMemo(() => buildDashboardGraph(transactions, range, metric, now, { bucketCount, pageOffset, minimumPeriods }), [transactions, range, metric, now, bucketCount, pageOffset, minimumPeriods]);
  const metricLabel = GRAPH_METRIC_OPTIONS.find((option) => option.id === metric)?.label ?? 'Spending';
  const rangeLabel = getGraphRangeLabel(range);
  const countLabel = `${data.recordCount} recorded ${data.recordCount === 1 ? 'transaction' : 'transactions'}`;
  const format = (value: number) => metric === 'transactionCount' ? value.toLocaleString('en-IN') : formatCurrency(value, undefined, true);
  const shares = type === 'donut' ? data.breakdown.map((point) => `${point.label}, ${(point.value / data.breakdownTotal * 100).toFixed(1)} percent`).join('. ') : '';
  const rangeText = <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs, textAlign: 'right' }}>{rangeLabel}</Text>;
  return <View onLayout={(event) => setCardWidth(Math.round(event.nativeEvent.layout.width))} style={{ backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.lg, borderWidth: 1, padding: compact ? Spacing.md : Spacing.lg }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: compact ? Spacing.sm : Spacing.md }}>
      <Text style={{ flex: 1, color: colors.textSecondary, fontSize: Typography.fontSize.sm }}>{countLabel}</Text>
      {onConfigure ? <PressableScale accessibilityRole="button" accessibilityLabel={`${rangeLabel}. Change graph grouping and style`} onPress={onConfigure} style={{ maxWidth: '45%', minHeight: 44, justifyContent: 'center' }}>{rangeText}</PressableScale> : <View style={{ maxWidth: '45%' }}>{rangeText}</View>}
    </View>
    <PressableScale accessibilityRole="button" accessibilityLabel={`${metricLabel}. ${GRAPH_TYPE_OPTIONS.find((option) => option.id === type)?.label}. ${countLabel}. ${rangeLabel} groups. ${data.periodLabel}. ${type === 'donut' ? 'Category shares.' : 'Oldest to newest, left to right.'} ${shares}`} accessibilityHint={graphAction.kind === 'graphs' ? 'Opens Your graphs to explore charts and change the grouping or style.' : 'Opens the recorded transactions for this chart. Select a record for full details.'} onPress={() => graphAction.kind === 'graphs' ? graphAction.onPress() : graphAction.onPress({ range, metric, asOf: now.toISOString(), periodStart: data.periodStart, periodEnd: data.periodEnd })} pressedScale={0.99}>
      <View style={{ flexDirection: type === 'donut' && data.hasData && fontScale < 1.4 ? 'row' : 'column', alignItems: type === 'donut' && data.hasData ? 'center' : 'stretch', gap: compact ? Spacing.sm : Spacing.md }}>
        <DashboardGraphPlot data={data} type={type} metric={metric} currencySymbol={currencySymbol} compact={compact} pieSize={fontScale >= 1.4 ? 96 : Math.min(compact ? 104 : 138, Math.max(80, (width - 112) * 0.44))} />
        {type === 'donut' ? <GraphBreakdown data={data} compact={compact} /> : null}
      </View>
    </PressableScale>
    <Text accessibilityLiveRegion="polite" style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: Spacing.sm }}>{data.periodLabel}</Text>
    {type === 'donut' ? <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: Spacing.xs }}>Shares across the shown periods</Text> : null}
    {data.hasOlder || data.hasNewer ? <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, marginTop: Spacing.sm }}>
      {[{ label: 'Older', available: data.hasOlder, offset: 1 }, { label: 'Newer', available: data.hasNewer, offset: -1 }].map(action => <PressableScale key={action.label} accessibilityRole="button" accessibilityLabel={`${action.label} ${data.bucketLabel.toLowerCase()}`} accessibilityState={{ disabled: !action.available }} disabled={!action.available} onPress={() => setPage({ range, offset: data.pageOffset + action.offset })} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.sm, opacity: action.available ? 1 : 0.4 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>{action.label}</Text>
      </PressableScale>)}
    </View> : null}
    {!compact && type !== 'donut' && data.hasData ? <>
      <PressableScale accessibilityRole="button" accessibilityLabel="Exact chart values" accessibilityState={{ expanded: details }} onPress={() => setDetails((value) => !value)} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', minHeight: 48, marginTop: Spacing.sm }}>
        <Text style={{ flex: 1, color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>{details ? 'Hide' : 'See'} exact values</Text>
        <AppIcon name={details ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textPrimary} />
      </PressableScale>
      {details ? <View style={{ gap: Spacing.md }}>{data.current.map((point, index) => <View key={index} accessible accessibilityLabel={`${data.bucketRanges[index]}, ${format(point.value)}`} style={{ borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: Spacing.sm, gap: 4 }}>
        <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>{data.bucketRanges[index]}</Text>
        <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>{format(point.value)}</Text>
      </View>)}</View> : null}
    </> : null}
  </View>;
}
