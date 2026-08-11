import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { CashflowPlan, CashflowPoint } from '@/utils/cashflowPlan';
import { formatCompactCurrency, formatCurrency } from '@/utils/formatCurrency';
import { withAlpha } from '@/utils/glassStyle';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 320;
const PLOT_LEFT = 76;
const PLOT_TOP = 34;
const PLOT_RIGHT = 18;
const PLOT_BOTTOM = 42;
const PLOT_WIDTH = VIEWBOX_WIDTH - PLOT_LEFT - PLOT_RIGHT;
const PLOT_HEIGHT = VIEWBOX_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
const GRID_LINE_COUNT = 4;

export const getY = (value: number, min: number, max: number, height: number) => {
  const range = Math.max(1, max - min);
  return height - ((value - min) / range) * height;
};

export const getX = (index: number, count: number, width: number) =>
  count <= 1 ? 0 : (index / (count - 1)) * width;

export const buildPath = (
  values: (number | null)[],
  width: number,
  height: number,
  min: number,
  max: number,
) => {
  let drawing = false;
  return values
    .map((value, index) => {
      if (value === null || !Number.isFinite(value)) {
        drawing = false;
        return null;
      }
      const command = drawing ? 'L' : 'M';
      drawing = true;
      return `${command} ${getX(index, values.length, width)} ${getY(value, min, max, height)}`;
    })
    .filter((value): value is string => Boolean(value))
    .join(' ');
};

export const getChartDomain = (values: (number | null)[]) => {
  const finiteValues = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (finiteValues.length === 0) return { min: -1, max: 1 };
  const minimum = Math.min(0, ...finiteValues);
  const maximum = Math.max(0, ...finiteValues);
  const padding = Math.max(1, (maximum - minimum) * 0.1);
  return { min: minimum - padding, max: maximum + padding };
};

const displayDate = (dateKey?: string, compact = false) => {
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return 'Not available';
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) return dateKey;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(compact ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  }).format(date);
};

const safeNumber = (value: number | null) => value !== null && Number.isFinite(value) ? value : null;

const getLastActualValue = (timeline: CashflowPoint[]) => {
  for (let index = timeline.length - 1; index >= 0; index -= 1) {
    const value = safeNumber(timeline[index].actualNetFlow);
    if (value !== null) return value;
  }
  return 0;
};

const getMarker = (
  type: 'income' | 'expense',
  x: number,
  y: number,
  color: string,
  surface: string,
  estimated: boolean,
  key: string,
) => type === 'income' ? (
  <Circle
    key={key}
    cx={x}
    cy={y}
    r={estimated ? 4.5 : 5}
    fill={estimated ? surface : color}
    stroke={color}
    strokeWidth={estimated ? 2 : 1.5}
  />
) : (
  <Rect
    key={key}
    x={x - 4}
    y={y - 4}
    width={8}
    height={8}
    rx={1}
    fill={estimated ? surface : color}
    stroke={color}
    strokeWidth={estimated ? 2 : 1.5}
    transform={`rotate(45 ${x} ${y})`}
  />
);

interface CashflowTimelineProps {
  plan: CashflowPlan;
  onViewTransactions: () => void;
}

export function CashflowTimeline({ plan, onViewTransactions }: CashflowTimelineProps) {
  const { colors } = useTheme();
  const actualValues = plan.timeline.map(({ actualNetFlow }) => safeNumber(actualNetFlow));
  const projectedValues = plan.timeline.map(({ projectedNetFlow }) => safeNumber(projectedNetFlow));
  const currentDayIndex = actualValues.reduce<number>(
    (latest, value, index) => value === null ? latest : index,
    -1,
  );
  const futureValues = projectedValues.map((value, index) =>
    plan.isForecastAvailable && index >= Math.max(0, currentDayIndex) ? value : null);
  const domain = getChartDomain([
    ...actualValues,
    ...(plan.isForecastAvailable ? projectedValues : []),
  ]);
  const actualPath = buildPath(actualValues, PLOT_WIDTH, PLOT_HEIGHT, domain.min, domain.max);
  const projectedPath = buildPath(futureValues, PLOT_WIDTH, PLOT_HEIGHT, domain.min, domain.max);
  const isEmpty = !plan.timeline.some((point) => {
    const actual = safeNumber(point.actualNetFlow) ?? 0;
    const projected = safeNumber(point.projectedNetFlow) ?? 0;
    return actual !== 0 || projected !== 0;
  });
  const tickValues = Array.from({ length: GRID_LINE_COUNT + 1 }, (_, index) =>
    domain.max - ((domain.max - domain.min) * index) / GRID_LINE_COUNT);
  const xTickIndexes = [...new Set([
    0,
    Math.floor((plan.timeline.length - 1) / 4),
    Math.floor((plan.timeline.length - 1) / 2),
    Math.floor(((plan.timeline.length - 1) * 3) / 4),
    Math.max(0, plan.timeline.length - 1),
  ])].filter((index) => index >= 0 && index < plan.timeline.length);
  const actualNetFlow = getLastActualValue(plan.timeline);
  const summaryRows = [
    { label: 'Opening date', value: displayDate(plan.timeline[0]?.date) },
    { label: 'Actual net flow', value: formatCurrency(actualNetFlow) },
    ...(plan.isForecastAvailable ? [
      { label: 'Estimated commitments', value: formatCurrency(plan.metrics.upcomingCommitments) },
      { label: 'Forecast net flow', value: formatCurrency(plan.metrics.forecastNetFlow) },
    ] : [
      { label: 'Period status', value: 'Closed reporting period' },
    ]),
  ];

  return (
    <View testID="cashflow-timeline">
      <Card variant="outlined" padding="lg">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: Spacing.md,
            marginBottom: Spacing.md,
          }}
        >
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text
              accessibilityRole="header"
              style={{
                color: colors.textPrimary,
                fontFamily: Typography.fontFamily.semiBold,
                fontSize: Typography.fontSize.md,
                lineHeight: Typography.lineHeight.md,
              }}
            >
              30-day cashflow timeline
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: Typography.fontFamily.regular,
                fontSize: Typography.fontSize.sm,
                lineHeight: Typography.lineHeight.sm,
                marginTop: Spacing.xs,
              }}
            >
              Cumulative movement from reviewed transactions — not a bank balance.
            </Text>
          </View>
          <Button
            title="View transactions"
            icon="format-list-bulleted"
            variant="ghost"
            size="sm"
            onPress={onViewTransactions}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: Spacing.base,
            marginBottom: Spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{ width: 24, height: 3, borderRadius: BorderRadius.full, backgroundColor: colors.chart2 }} />
            <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>
              Actual net flow
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{ width: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
              {[0, 1, 2].map((segment) => (
                <View key={segment} style={{ width: 6, height: 3, borderRadius: BorderRadius.full, backgroundColor: colors.info }} />
              ))}
            </View>
            <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>
              {plan.isForecastAvailable ? 'Estimated from reviewed transaction history' : 'Closed reporting period'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{ width: 9, height: 9, borderRadius: BorderRadius.full, backgroundColor: colors.success }} />
            <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm }}>
              Income
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{ width: 8, height: 8, transform: [{ rotate: '45deg' }], backgroundColor: colors.warning }} />
            <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm }}>
              Expense
            </Text>
          </View>
        </View>

        {isEmpty ? (
          <EmptyState
            icon="chart-line"
            title="Add transactions to build your cashflow timeline."
            message="Reviewed income and expenses will appear here as cumulative net flow."
            action={(
              <Button
                title="View transactions"
                icon="format-list-bulleted"
                variant="outline"
                size="sm"
                onPress={onViewTransactions}
              />
            )}
          />
        ) : (
          <View
            style={{
              width: '100%',
              minHeight: VIEWBOX_HEIGHT,
              borderRadius: BorderRadius.md,
              backgroundColor: withAlpha(colors.surfaceElevated, 0.58),
              borderWidth: 1,
              borderColor: colors.borderLight,
              overflow: 'hidden',
            }}
          >
            <View aria-hidden={true} style={{ width: '100%' }}>
              <Svg
                width="100%"
                height={VIEWBOX_HEIGHT}
                viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                focusable={false}
              >
              <G transform={`translate(${PLOT_LEFT} ${PLOT_TOP})`}>
                {tickValues.map((tick) => {
                  const y = getY(tick, domain.min, domain.max, PLOT_HEIGHT);
                  return (
                    <G key={tick}>
                      <Line
                        x1={0}
                        y1={y}
                        x2={PLOT_WIDTH}
                        y2={y}
                        stroke={withAlpha(colors.border, 0.42)}
                        strokeWidth={1}
                      />
                      <SvgText
                        x={-12}
                        y={y + 4}
                        fill={colors.textTertiary}
                        fontFamily={Typography.fontFamily.regular}
                        fontSize={11}
                        textAnchor="end"
                      >
                        {formatCompactCurrency(Math.round(tick))}
                      </SvgText>
                    </G>
                  );
                })}
                <Line
                  x1={0}
                  y1={getY(0, domain.min, domain.max, PLOT_HEIGHT)}
                  x2={PLOT_WIDTH}
                  y2={getY(0, domain.min, domain.max, PLOT_HEIGHT)}
                  stroke={withAlpha(colors.textTertiary, 0.7)}
                  strokeDasharray="5 6"
                  strokeWidth={1.25}
                />
                {actualPath ? (
                  <Path
                    d={actualPath}
                    fill="none"
                    stroke={colors.chart2}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
                {plan.isForecastAvailable && projectedPath ? (
                  <Path
                    d={projectedPath}
                    fill="none"
                    stroke={colors.info}
                    strokeWidth={2.5}
                    strokeDasharray="8 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
                {plan.timeline.flatMap((point, pointIndex) => {
                  const x = getX(pointIndex, plan.timeline.length, PLOT_WIDTH);
                  const actual = actualValues[pointIndex];
                  const projected = projectedValues[pointIndex];
                  const actualMarkers = actual === null ? [] : point.actualEvents.map((event, eventIndex) =>
                    getMarker(
                      event.type,
                      x + (eventIndex - (point.actualEvents.length - 1) / 2) * 5,
                      getY(actual, domain.min, domain.max, PLOT_HEIGHT),
                      event.type === 'income' ? colors.success : colors.warning,
                      colors.surface,
                      false,
                      `actual-${event.id}`,
                    ));
                  const projectedMarkers = !plan.isForecastAvailable || projected === null ? [] : point.projectedEvents.map((event, eventIndex) =>
                    getMarker(
                      event.type,
                      x + (eventIndex - (point.projectedEvents.length - 1) / 2) * 5,
                      getY(projected, domain.min, domain.max, PLOT_HEIGHT),
                      event.type === 'income' ? colors.success : colors.warning,
                      colors.surface,
                      true,
                      `projected-${event.id}`,
                    ));
                  return [...actualMarkers, ...projectedMarkers];
                })}
                {plan.isForecastAvailable && currentDayIndex >= 0 ? (
                  <G>
                    <Line
                      x1={getX(currentDayIndex, plan.timeline.length, PLOT_WIDTH)}
                      y1={0}
                      x2={getX(currentDayIndex, plan.timeline.length, PLOT_WIDTH)}
                      y2={PLOT_HEIGHT}
                      stroke={colors.info}
                      strokeDasharray="4 5"
                      strokeWidth={1.5}
                    />
                    <Circle
                      cx={getX(currentDayIndex, plan.timeline.length, PLOT_WIDTH)}
                      cy={getY(actualValues[currentDayIndex] ?? 0, domain.min, domain.max, PLOT_HEIGHT)}
                      r={5}
                      fill={colors.surface}
                      stroke={colors.info}
                      strokeWidth={2.5}
                    />
                    <Rect
                      x={Math.max(0, Math.min(PLOT_WIDTH - 54, getX(currentDayIndex, plan.timeline.length, PLOT_WIDTH) - 27))}
                      y={-26}
                      width={54}
                      height={20}
                      rx={6}
                      fill={colors.accentLight}
                      stroke={colors.info}
                      strokeWidth={1}
                    />
                    <SvgText
                      x={Math.max(27, Math.min(PLOT_WIDTH - 27, getX(currentDayIndex, plan.timeline.length, PLOT_WIDTH)))}
                      y={-12}
                      fill={colors.info}
                      fontFamily={Typography.fontFamily.semiBold}
                      fontSize={11}
                      textAnchor="middle"
                    >
                      Today
                    </SvgText>
                  </G>
                ) : null}
                {plan.timeline.length === 1 && actualValues[0] !== null ? (
                  <Circle
                    cx={0}
                    cy={getY(actualValues[0], domain.min, domain.max, PLOT_HEIGHT)}
                    r={5}
                    fill={colors.surface}
                    stroke={colors.chart2}
                    strokeWidth={2.5}
                  />
                ) : null}
                {xTickIndexes.map((index) => (
                  <SvgText
                    key={plan.timeline[index].date}
                    x={getX(index, plan.timeline.length, PLOT_WIDTH)}
                    y={PLOT_HEIGHT + 28}
                    fill={colors.textTertiary}
                    fontFamily={Typography.fontFamily.medium}
                    fontSize={11}
                    textAnchor={index === 0 ? 'start' : index === plan.timeline.length - 1 ? 'end' : 'middle'}
                  >
                    {displayDate(plan.timeline[index].date, true)}
                  </SvgText>
                ))}
                </G>
              </Svg>
            </View>
          </View>
        )}

        {plan.ignoredTransactionCount > 0 ? (
          <Text
            accessibilityRole="alert"
            style={{
              color: colors.warning,
              fontFamily: Typography.fontFamily.medium,
              fontSize: Typography.fontSize.sm,
              lineHeight: Typography.lineHeight.sm,
              marginTop: Spacing.md,
            }}
          >
            Some records were excluded because their dates could not be read.
          </Text>
        ) : null}

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
            marginTop: Spacing.lg,
            paddingTop: Spacing.md,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              color: colors.textSecondary,
              fontFamily: Typography.fontFamily.semiBold,
              fontSize: Typography.fontSize.sm,
              lineHeight: Typography.lineHeight.sm,
              marginBottom: Spacing.sm,
            }}
          >
            Cashflow timeline summary
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {summaryRows.map((row) => (
              <View
                key={row.label}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${row.label}: ${row.value}`}
                style={{
                  flexGrow: 1,
                  flexBasis: 170,
                  minWidth: 0,
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.md,
                  borderRadius: BorderRadius.sm,
                  backgroundColor: colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Text style={{ color: colors.textTertiary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs }}>
                  {row.label}
                </Text>
                <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, marginTop: 2 }}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </View>
  );
}

export default CashflowTimeline;
