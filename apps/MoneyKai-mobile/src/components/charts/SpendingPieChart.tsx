import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { getCategoryById } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatCurrency';
import type { CategoryTotal } from '../../types/transaction';
import { Typography, Spacing } from '../../constants/theme';

interface SpendingPieChartProps {
  categoryTotals?: CategoryTotal[];
  totalSpent?: number;
  onPressViewMore?: () => void;
}

export const SpendingPieChart: React.FC<SpendingPieChartProps> = ({
  categoryTotals: categoryTotalsProp,
  totalSpent: totalSpentProp,
  onPressViewMore,
}) => {
  const { colors, isDark } = useTheme();
  const storeCategoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const storeTotalSpent = useTransactionStore((s) => s.getTotalSpent());
  const categoryTotals = categoryTotalsProp ?? storeCategoryTotals;
  const totalSpent = totalSpentProp ?? storeTotalSpent;

  const chartColors = React.useMemo(
    () => [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5, colors.chart6, colors.chart7, colors.chart8],
    [colors]
  );

  const pieData = React.useMemo(
    () =>
      categoryTotals.slice(0, 6).map((cat, index) => ({
        value: cat.total,
        color: chartColors[index % chartColors.length],
        text: `${Math.round(cat.percentage)}%`,
        focused: index === 0,
      })),
    [categoryTotals, chartColors]
  );

  const renderCenterLabel = React.useCallback(
    () => (
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: Typography.fontSize.xs,
            fontFamily: Typography.fontFamily.regular,
            color: colors.textTertiary,
          }}
        >
          Total Spent
        </Text>
        <Text
          style={{
            fontSize: Typography.fontSize.md,
            fontFamily: Typography.fontFamily.bold,
            color: colors.textPrimary,
          }}
        >
          {formatCurrency(totalSpent)}
        </Text>
      </View>
    ),
    [colors, totalSpent]
  );

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
          Spending Overview
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              donut
              radius={70}
              innerRadius={45}
              innerCircleColor={isDark ? colors.surface : colors.card}
              centerLabelComponent={renderCenterLabel}
            />
          ) : (
            <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.textTertiary }}>No spending data</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1, marginLeft: Spacing.base }}>
          {categoryTotals.slice(0, 6).map((cat, index) => {
            const category = getCategoryById(cat.category);
            return (
              <View
                key={cat.category}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: chartColors[index % chartColors.length],
                    marginRight: 8,
                  }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: Typography.fontSize.xs,
                    fontFamily: Typography.fontFamily.medium,
                    color: colors.textPrimary,
                  }}
                >
                  {category?.name?.split(' ')[0] || cat.category}
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.xs,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.textSecondary,
                  }}
                >
                  {Math.round(cat.percentage)}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      <TouchableOpacity
        onPress={onPressViewMore}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: Spacing.md,
          gap: 4,
        }}
      >
        <Text
          style={{
            fontSize: Typography.fontSize.sm,
            fontFamily: Typography.fontFamily.medium,
            color: colors.primary,
          }}
        >
          View budget details
        </Text>
        <Text style={{ color: colors.primary }}>→</Text>
      </TouchableOpacity>
    </Card>
  );
};

export default SpendingPieChart;
