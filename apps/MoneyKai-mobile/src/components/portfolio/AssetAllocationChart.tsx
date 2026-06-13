import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { AssetAllocationSlice } from '@/types/wealth';
import { formatCurrency } from '@/utils/formatCurrency';

interface AssetAllocationChartProps {
  allocation: AssetAllocationSlice[];
  currencySymbol: string;
}

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({ allocation, currencySymbol }) => {
  const { colors } = useTheme();

  return (
    <Card style={{ gap: Spacing.md }}>
      <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
        Asset allocation
      </Text>
      {allocation.length === 0 ? (
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          No tracked holdings yet.
        </Text>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {allocation.map((slice) => (
            <View key={slice.assetType} style={{ gap: Spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: slice.color }} />
                <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textPrimary }}>
                  {slice.label}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                  {slice.percent.toFixed(1)}%
                </Text>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.borderLight, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(100, slice.percent)}%`, height: 8, backgroundColor: slice.color }} />
              </View>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                {formatCurrency(slice.value, currencySymbol)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
};
