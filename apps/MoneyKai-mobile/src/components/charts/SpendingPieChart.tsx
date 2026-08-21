import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { getCategoryById } from '../../constants/categories';
import { SpendingTrendInsightCard } from './SpendingTrendInsightCard';
import { formatCurrency } from '../../utils/formatCurrency';
import type { CategoryTotal } from '../../types/transaction';
import type { SpendingTrendInsight } from '../../utils/dashboard';
import { BorderRadius, Shadows, Typography, Spacing } from '../../constants/theme';

interface SpendingPieChartProps {
  categoryTotals?: CategoryTotal[];
  totalSpent?: number;
  onPressViewMore?: () => void;
  actionLabel?: string;
  trendInsight?: SpendingTrendInsight | null;
  onPressTrendInsight?: () => void;
}

type PieDataItem = {
  category: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
};

const MAX_VISIBLE_CATEGORIES = 6;

export const SpendingPieChart: React.FC<SpendingPieChartProps> = ({
  categoryTotals: categoryTotalsProp,
  totalSpent: totalSpentProp,
  onPressViewMore,
  actionLabel = 'View budget details',
  trendInsight,
  onPressTrendInsight,
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
  const totalForChart = React.useMemo(() => {
    const categoryTotal = categoryTotals.reduce(
      (sum, category) => sum + (Number.isFinite(category.total) && category.total > 0 ? category.total : 0),
      0
    );
    return Math.max(0, totalSpent, categoryTotal);
  }, [categoryTotals, totalSpent]);

  const pieData = React.useMemo<PieDataItem[]>(() => {
    const positiveCategories = categoryTotals.filter((category) => Number.isFinite(category.total) && category.total > 0);
    const categorizedTotal = positiveCategories.reduce((sum, category) => sum + category.total, 0);
    const categoriesWithRemainder = totalForChart > categorizedTotal
      ? [
          ...positiveCategories,
          {
            category: 'unassigned-spend',
            total: totalForChart - categorizedTotal,
            percentage: 0,
            count: 0,
          },
        ]
      : positiveCategories;
    const visibleCategories = categoriesWithRemainder.length > MAX_VISIBLE_CATEGORIES
      ? [
          ...categoriesWithRemainder.slice(0, MAX_VISIBLE_CATEGORIES - 1),
          {
            category: 'other-categories',
            total: categoriesWithRemainder.slice(MAX_VISIBLE_CATEGORIES - 1).reduce((sum, category) => sum + category.total, 0),
            percentage: 0,
            count: 0,
          },
        ]
      : categoriesWithRemainder;

    return visibleCategories.map((category, index) => ({
      category: category.category,
      label:
        category.category === 'other-categories'
          ? 'Other categories'
          : category.category === 'unassigned-spend'
            ? 'Uncategorised spend'
            : getCategoryById(category.category)?.name ?? category.category,
      value: category.total,
      percentage: totalForChart > 0 ? (category.total / totalForChart) * 100 : 0,
      color: chartColors[index % chartColors.length],
    }));
  }, [categoryTotals, chartColors, totalForChart]);

  return (
    <Card
      style={{
        borderWidth: 1,
        borderColor: colors.borderLight,
        ...Shadows.md,
        shadowColor: colors.shadowColor,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md, gap: Spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 22, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Spending mix
          </Text>
          <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
            Largest categories for this month
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: Spacing.sm,
            paddingVertical: 6,
            borderRadius: BorderRadius.full,
            backgroundColor: colors.accentLight,
            borderWidth: 1,
            borderColor: `${colors.accent}24`,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.accent }}>
            Reviewed
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.base }}>
        <View style={{ width: 156, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xs }}>
          {pieData.length > 0 ? (
            <View style={{ width: 136, height: 136, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={136} height={136} viewBox="0 0 136 136" style={{ position: 'absolute' }}>
                <Circle cx={68} cy={68} r={58} stroke={colors.borderLight} strokeWidth={18} fill="none" />
                {pieData.reduce<{ nodes: React.ReactNode[]; offset: number }>(
                  (acc, cat) => {
                    const dash = (cat.value / Math.max(1, totalForChart)) * circumference;
                    acc.nodes.push(
                      <Circle
                        key={cat.category}
                        cx={68}
                        cy={68}
                        r={58}
                        stroke={cat.color}
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
                  {formatCurrency(totalForChart)}
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

        <View style={{ flex: 1, minWidth: 0, gap: 7 }}>
          {pieData.map((cat) => {
            return (
              <View key={cat.category} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 24, gap: Spacing.sm }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color }} />
                <Text numberOfLines={1} style={{ flex: 1, fontSize: Typography.fontSize.xs, lineHeight: 16, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                  {cat.label}
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  style={{ fontSize: Typography.fontSize.xs, lineHeight: 16, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary, textAlign: 'right', minWidth: 34 }}
                >
                  {formatCurrency(cat.value)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      {trendInsight ? (
        <View style={{ marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
          <SpendingTrendInsightCard insight={trendInsight} onPress={onPressTrendInsight} />
        </View>
      ) : null}
      <TouchableOpacity
        onPress={onPressViewMore}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
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
