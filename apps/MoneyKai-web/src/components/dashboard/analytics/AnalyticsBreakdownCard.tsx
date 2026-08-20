import React from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { CategoryTotal } from '@/types/transaction';
import { formatCurrency } from '@/utils/formatCurrency';

interface Props {
  categories: CategoryTotal[];
  onViewDetails: () => void;
}

const displayCategory = (value: string) => value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export function AnalyticsBreakdownCard({ categories, onViewDetails }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 560;
  const palette = [colors.chart2, colors.chart1, colors.chart3, colors.chart4, colors.chart5, colors.chart6];
  const visibleCategories = categories.slice(0, 5);
  const total = visibleCategories.reduce((sum, category) => sum + category.total, 0);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const selected = visibleCategories.find((category) => category.category === selectedCategory);
  const pieData = visibleCategories.map((category, index) => ({
    value: category.total,
    color: palette[index % palette.length],
    focused: category.category === selectedCategory,
    onPress: () => setSelectedCategory((current) => current === category.category ? null : category.category),
  }));

  return (
    <View style={{ flex: 1, minWidth: 0, minHeight: 430, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.card }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <MaterialCommunityIcons name="view-grid-outline" size={20} color={colors.textSecondary} />
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>Spending breakdown</Text>
        </View>
        <MaterialCommunityIcons name="dots-horizontal" size={21} color={colors.textTertiary} />
      </View>

      {pieData.length ? (
        <View style={{ marginTop: Spacing.lg, flexDirection: compact ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg }}>
          <PieChart
            data={pieData}
            donut
            radius={compact ? 78 : 88}
            innerRadius={compact ? 56 : 64}
            innerCircleColor={colors.card}
            centerLabelComponent={() => (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>{selected ? `${Math.round(selected.percentage)}%` : formatCurrency(total)}</Text>
                <Text style={{ marginTop: 2, fontSize: 10, color: colors.textTertiary }}>{selected ? displayCategory(selected.category) : 'reviewed spend'}</Text>
              </View>
            )}
          />
          <View style={{ flex: 1, alignSelf: 'stretch', justifyContent: 'center', gap: Spacing.sm }}>
            {visibleCategories.map((category, index) => {
              const active = category.category === selectedCategory;
              return (
                <TouchableOpacity key={category.category} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setSelectedCategory((current) => current === category.category ? null : category.category)} style={{ minHeight: 38, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: active ? colors.surfaceElevated : 'transparent' }}>
                  <View style={{ width: 7, height: 20, borderRadius: BorderRadius.full, backgroundColor: palette[index % palette.length] }} />
                  <Text style={{ flex: 1, fontSize: Typography.fontSize.xs, color: colors.textSecondary }} numberOfLines={1}>{displayCategory(category.category)}</Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{formatCurrency(category.total)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
          <View style={{ width: 72, height: 72, borderRadius: BorderRadius.full, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="chart-donut" size={30} color={colors.textTertiary} /></View>
          <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>No spending mix yet</Text>
          <Text style={{ marginTop: 5, maxWidth: 290, textAlign: 'center', fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>Reviewed expense categories will appear here automatically.</Text>
        </View>
      )}

      <TouchableOpacity accessibilityRole="button" onPress={onViewDetails} style={{ marginTop: 'auto', minHeight: 48, borderRadius: BorderRadius.md, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm }}>
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>More details</Text>
        <MaterialCommunityIcons name="arrow-right" size={18} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}
