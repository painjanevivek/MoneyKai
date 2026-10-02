import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { AppText as Text } from '@/components/ui/AppText';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { convertFromInrForDisplay } from '@/utils/formatCurrency';
import type { DashboardGraphData, DashboardGraphMetric, DashboardGraphType } from '@/utils/dashboardGraph';

export type DashboardGraphPlotProps = { data: DashboardGraphData; type: DashboardGraphType; metric: DashboardGraphMetric; currencySymbol: string; compact?: boolean; pieSize?: number };
export const CHART_PALETTE = ['#A9C7F5', '#A6D5C9', '#F3D09D', '#CAB9EB', '#F0BAC9', '#C4CDD8'];
const shortNumber = (value: number) => Math.abs(value) >= 100000 ? `${+(value / 100000).toFixed(1)}L` : Math.abs(value) >= 1000 ? `${+(value / 1000).toFixed(1)}k` : `${Math.round(value)}`;

export function DashboardGraphPlot({ data, type, metric, currencySymbol, compact = false, pieSize }: DashboardGraphPlotProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(300);
  const height = compact ? 160 : 230;
  const isCount = metric === 'transactionCount';
  const current = data.current.map((point) => ({ ...point, value: isCount ? point.value : convertFromInrForDisplay(point.value) }));
  const formatAxis = (value: number) => `${value < 0 ? '−' : ''}${isCount ? '' : currencySymbol}${shortNumber(Math.abs(value))}`;
  if (!data.hasData) return <View style={{ alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: BorderRadius.md, justifyContent: 'center', minHeight: height, padding: Spacing.lg }}>
    <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold }}>No {metric === 'income' ? 'income' : metric === 'spending' ? 'spending' : 'transactions'} in the shown periods</Text>
    <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: 6, textAlign: 'center' }}>Browse older periods, choose another grouping, or add a confirmed transaction.</Text>
  </View>;
  if (type === 'donut') {
    const size = pieSize ?? (compact ? 104 : 188);
    const ringWidth = size * 0.14;
    const radius = (size - ringWidth - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    return <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} accessible={false} importantForAccessibility="no-hide-descendants">
        {data.breakdown.map((point, index) => {
          const length = point.value / data.breakdownTotal * circumference;
          const start = offset;
          offset += length;
          const center = radius + ringWidth / 2 + 4;
          return <Circle key={point.label} cx={center} cy={center} r={radius} fill="none" stroke={CHART_PALETTE[index]} strokeWidth={ringWidth} strokeDasharray={`${Math.max(0, length - (data.breakdown.length > 1 ? 2 : 0))} ${circumference}`} strokeDashoffset={-start} rotation={-90} origin={`${center}, ${center}`} />;
        })}
      </Svg>
    </View>;
  }
  const left = 58, right = width - 12, top = 24, bottom = height - 28;
  const max = Math.max(0, ...current.map((point) => point.value));
  const min = Math.min(0, ...current.map((point) => point.value));
  const span = Math.max(max - min, 1);
  const magnitude = 10 ** Math.floor(Math.log10(span / 3));
  const normalized = span / 3 / magnitude;
  const step = Math.max(isCount ? 1 : 0, (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude);
  const axisMax = max === 0 && min < 0 ? 0 : Math.max(step, Math.ceil(max / step) * step);
  const axisMin = min < 0 ? Math.floor(min / step) * step : 0;
  const y = (value: number) => top + (axisMax - value) / (axisMax - axisMin) * (bottom - top);
  const groupWidth = (right - left) / current.length;
  const x = (index: number) => left + groupWidth * (index + 0.5);
  const points = current.map((point, index) => ({ x: x(index), y: y(point.value) }));
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const ticks = [...new Set(axisMin < 0 ? [axisMax, 0, axisMin] : [axisMax, isCount ? Math.floor(axisMax / 2) : axisMax / 2, 0])];
  const labelIndexes = new Set(current.map((_, index) => index));
  return <View onLayout={(event) => setWidth(Math.max(180, Math.round(event.nativeEvent.layout.width)))} accessible={false} importantForAccessibility="no-hide-descendants">
    <Svg width={width} height={height} accessible={false}>
      {ticks.map((tick, index) => <React.Fragment key={index}>
        <Line x1={left} x2={right} y1={y(tick)} y2={y(tick)} stroke={tick === 0 ? colors.textSecondary : colors.borderLight} strokeWidth={1} />
        <SvgText x={left - 8} y={y(tick) + 4} fill={colors.textSecondary} fontSize={11} textAnchor="end">{formatAxis(tick)}</SvgText>
      </React.Fragment>)}
      {type === 'line' ? <>
        <Path d={`${path} L ${points.at(-1)!.x} ${y(0)} L ${points[0].x} ${y(0)} Z`} fill={colors.chart1} opacity={0.08} />
        <Path d={path} fill="none" stroke={colors.chart1} strokeWidth={2.5} strokeLinejoin="round" />
        {points.map((point, index) => <Circle key={index} cx={point.x} cy={point.y} r={4} fill={colors.chart1} stroke={colors.card} strokeWidth={2} />)}
      </> : current.map((point, index) => <Rect key={index} x={x(index) - groupWidth * 0.28} y={Math.min(y(0), y(point.value))} width={groupWidth * 0.56} height={Math.abs(y(0) - y(point.value))} rx={3} fill={point.value < 0 ? colors.error : colors.chart1} />)}
      {current.map((point, index) => labelIndexes.has(index) ? <SvgText key={index} x={x(index)} y={height - 4} fill={colors.textSecondary} fontSize={10} textAnchor="middle">{point.label}</SvgText> : null)}
    </Svg>
  </View>;
}
