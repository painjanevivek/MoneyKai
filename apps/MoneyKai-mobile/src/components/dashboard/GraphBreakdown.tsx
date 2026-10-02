import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { DashboardGraphData } from '@/utils/dashboardGraph';
import { CHART_PALETTE } from './DashboardGraphPlot';

export function GraphBreakdown({ data, compact = false }: { data: DashboardGraphData; compact?: boolean }) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale >= 1.4;
  if (!data.hasData) return null;
  return <View style={{ flex: stacked ? undefined : 1, alignSelf: 'stretch', minWidth: 0, gap: compact ? Spacing.xs : Spacing.sm }}>
    {data.breakdown.map((point, index) => {
      const percent = point.value / data.breakdownTotal * 100;
      const share = `${percent < 1 ? '<1' : percent.toFixed(1).replace(/\.0$/, '')}%`;
      return <View key={point.label} accessible accessibilityLabel={`${point.label}, ${share} of total`} style={{ flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', gap: 4 }}>
        <View style={{ flex: stacked ? undefined : 1, minWidth: 0, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <View style={{ width: 9, height: 9, flexShrink: 0, backgroundColor: CHART_PALETTE[index], borderRadius: 3 }} />
          <Text style={{ color: colors.textPrimary, flex: 1, fontSize: compact ? Typography.fontSize.xs : Typography.fontSize.sm }}>{point.label}</Text>
        </View>
        <Text style={{ color: colors.textPrimary, paddingLeft: stacked ? 15 : 0, fontFamily: Typography.fontFamily.semiBold, fontSize: compact ? Typography.fontSize.xs : Typography.fontSize.sm }}>{share}</Text>
      </View>;
    })}
  </View>;
}
