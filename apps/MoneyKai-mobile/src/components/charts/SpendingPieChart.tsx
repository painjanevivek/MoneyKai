import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { getCategoryById } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatCurrency';
import type { CategoryTotal } from '../../types/transaction';
import { BorderRadius, Shadows, Typography, Spacing } from '../../constants/theme';

interface SpendingPieChartProps {
  categoryTotals?: CategoryTotal[];
  totalSpent?: number;
  onPressViewMore?: () => void;
  actionLabel?: string;
}

export const SpendingPieChart: React.FC<SpendingPieChartProps> = ({
  categoryTotals: categoryTotalsProp,
  totalSpent: totalSpentProp,
  onPressViewMore,
  actionLabel = 'View budget details',
}) => {
  const { colors } = useTheme();
  const storeCategoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const storeTotalSpent = useTransactionStore((s) => s.getTotalSpent());
  const categoryTotals = categoryTotalsProp ?? storeCategoryTotals;
  const totalSpent = totalSpentProp ?? storeTotalSpent;
  const circumference = 2 * Math.PI * 58;

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
          Expenses
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
    <Card
      style={{
        borderWidth: 1,
        borderColor: colors.borderLight,
        ...Shadows.md,
        shadowColor: colors.shadowColor,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 22, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          Spending Overview
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.base }}>
        <View style={{ width: 156, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xs }}>
          {pieData.length > 0 ? (
            <View style={{ width: 136, height: 136, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={136} height={136} viewBox="0 0 136 136" style={{ position: 'absolute' }}>
                <Circle cx={68} cy={68} r={58} stroke={colors.borderLight} strokeWidth={18} fill="none" />
                {pieData.reduce<{ nodes: React.ReactNode[]; offset: number }>(
                  (acc, cat, index) => {
                    const dash = (cat.total / Math.max(1, totalSpent)) * circumference;
                    acc.nodes.push(
                      <Circle
                        key={cat.category}
                        cx={68}
                        cy={68}
                        r={58}
                        stroke={chartColors[index % chartColors.length]}
                        strokeWidth={18}
                        fill="none"
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={-acc.offset}
                        strokeLinecap="round"
                        rotation={-90}
                        originX={68}
                        originY={68}
                      />
                    );
                    acc.offset += dash;
                    return acc;
                  },
                  { nodes: [], offset: 0 }
                ).nodes}
              </Svg>
              <View style={{ alignItems: 'center', width: 88 }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>Total Spent</Text>
                <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary, textAlign: 'center' }}>
                  {formatCurrency(totalSpent)}
                </Text>
              </View>
            </View>
          ) : (
            <View
              style={{
                width: 136,
                height: 136,
                borderRadius: 68,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <Text style={{ color: colors.textTertiary, fontSize: Typography.fontSize.xs, textAlign: 'center' }}>
                No spending data
              </Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1, gap: 7 }}>
          {categoryTotals.slice(0, 6).map((cat, index) => {
            const category = getCategoryById(cat.category);
            return (
              <View key={cat.category} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 24, gap: Spacing.sm }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: chartColors[index % chartColors.length] }} />
                <Text numberOfLines={1} style={{ flex: 1, fontSize: Typography.fontSize.xs, lineHeight: 16, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                  {category?.name?.split(' ')[0] || cat.category}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 16, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary, textAlign: 'right', minWidth: 34 }}>
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
          alignSelf: 'flex-start',
          minHeight: 36,
          paddingHorizontal: Spacing.md,
          borderRadius: BorderRadius.full,
          backgroundColor: colors.primaryBg,
          marginTop: Spacing.md,
          gap: 6,
        }}
      >
        <Text
          style={{
            fontSize: Typography.fontSize.sm,
            lineHeight: 18,
            fontFamily: Typography.fontFamily.medium,
            color: colors.primary,
          }}
        >
          {actionLabel}
        </Text>
        <MaterialCommunityIcons name="arrow-right" size={16} color={colors.primary} />
      </TouchableOpacity>
    </Card>
  );
};

export default SpendingPieChart;
