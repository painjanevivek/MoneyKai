import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { getCategoryById } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatCurrency';
import { Typography, Spacing } from '../../constants/theme';
import type { CategoryTotal } from '../../types/transaction';

type CategoryBarChartProps = {
  categoryTotals?: CategoryTotal[];
  onViewAll?: () => void;
};

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ categoryTotals: categoryTotalsProp, onViewAll }) => {
  const { colors } = useTheme();
  const storeCategoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const categoryTotals = categoryTotalsProp ?? storeCategoryTotals;
  const maxTotal = categoryTotals.length > 0 ? categoryTotals[0].total : 1;

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text style={{
          fontSize: Typography.fontSize.md,
          fontFamily: Typography.fontFamily.semiBold,
          color: colors.textPrimary,
        }}>Top Categories</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={{
            fontSize: Typography.fontSize.sm,
            fontFamily: Typography.fontFamily.medium,
            color: colors.primary,
          }}>View All</Text>
        </TouchableOpacity>
      </View>
      {categoryTotals.length === 0 ? (
        <View
          style={{
            minHeight: 112,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
            padding: Spacing.md,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' }}>
            Expense categories appear after you add transactions.
          </Text>
        </View>
      ) : categoryTotals.slice(0, 5).map((cat) => {
        const category = getCategoryById(cat.category);
        const barWidth = (cat.total / maxTotal) * 100;
        return (
          <View key={cat.category} style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons
                  name={(category?.icon || 'help-circle-outline') as any}
                  size={16}
                  color={category?.color || colors.textSecondary}
                />
                <Text style={{
                  fontSize: Typography.fontSize.sm,
                  fontFamily: Typography.fontFamily.medium,
                  color: colors.textPrimary,
                }}>{category?.name?.split(' &')[0] || cat.category}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{
                  fontSize: Typography.fontSize.sm,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textPrimary,
                }}>{formatCurrency(cat.total)}</Text>
                <Text style={{
                  fontSize: Typography.fontSize.xs,
                  fontFamily: Typography.fontFamily.regular,
                  color: colors.textTertiary,
                }}>({Math.round(cat.percentage)}%)</Text>
              </View>
            </View>
            <View style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.borderLight,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${barWidth}%`,
                borderRadius: 3,
                backgroundColor: category?.color || colors.primary,
              }} />
            </View>
          </View>
        );
      })}
    </Card>
  );
};

export default CategoryBarChart;
