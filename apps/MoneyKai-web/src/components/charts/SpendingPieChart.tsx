import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { getCategoryById } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatCurrency';
import { Typography, Spacing } from '../../constants/theme';

export const SpendingPieChart: React.FC = () => {
  const { colors } = useTheme();
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());

  const chartColors = React.useMemo(() => [
    colors.chart1, colors.chart2, colors.chart3,
    colors.chart4, colors.chart5, colors.chart6,
    colors.chart7, colors.chart8,
  ], [colors]);

  const pieData = React.useMemo(() => {
    return categoryTotals.slice(0, 6).map((cat, index) => ({
      value: cat.total,
      color: getCategoryById(cat.category)?.color || chartColors[index % chartColors.length],
      text: `${Math.round(cat.percentage)}%`,
      focused: index === 0,
    }));
  }, [categoryTotals, chartColors]);

  const renderCenterLabel = React.useCallback(() => {
    return (
      <View style={{ alignItems: 'center' }}>
        <Text style={{
          fontSize: Typography.fontSize.xs,
          fontFamily: Typography.fontFamily.regular,
          color: colors.textTertiary,
        }}>Total Spent</Text>
        <Text style={{
          fontSize: Typography.fontSize.md,
          fontFamily: Typography.fontFamily.bold,
          color: colors.textPrimary,
        }}>{formatCurrency(totalSpent)}</Text>
      </View>
    );
  }, [colors, totalSpent]);

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text style={{
          fontSize: Typography.fontSize.md,
          fontFamily: Typography.fontFamily.semiBold,
          color: colors.textPrimary,
        }}>Spending Overview</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              donut
              radius={70}
              innerRadius={45}
              innerCircleColor={colors.card}
              centerLabelComponent={renderCenterLabel}
            />
          ) : (
            <View style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.textTertiary }}>No data</Text>
            </View>
          )}
        </View>
        {/* Legend */}
        <View style={{ flex: 1, marginLeft: Spacing.base }}>
          {categoryTotals.slice(0, 6).map((cat, index) => {
            const category = getCategoryById(cat.category);
            return (
              <View key={cat.category} style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
              }}>
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: category?.color || chartColors[index],
                  marginRight: 8,
                }} />
                <Text style={{
                  flex: 1,
                  fontSize: Typography.fontSize.xs,
                  fontFamily: Typography.fontFamily.medium,
                  color: colors.textPrimary,
                }}>{category?.name?.split(' ')[0] || cat.category}</Text>
                <Text style={{
                  fontSize: Typography.fontSize.xs,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textSecondary,
                }}>{Math.round(cat.percentage)}%</Text>
              </View>
            );
          })}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => router.push('/savings')}
        accessibilityRole="button"
        accessibilityLabel="View spending analytics in Savings"
        style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.md,
        gap: 4,
      }}
      >
        <Text style={{
          fontSize: Typography.fontSize.sm,
          fontFamily: Typography.fontFamily.medium,
          color: colors.primary,
        }}>View in Savings</Text>
        <Text style={{ color: colors.primary }}>→</Text>
      </TouchableOpacity>
    </Card>
  );
};

export default SpendingPieChart;
