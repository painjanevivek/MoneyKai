import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { getCategoryById } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatCurrency';
import { Typography, Spacing } from '../../constants/theme';

export const CategoryBarChart: React.FC<{ onViewAll?: () => void }> = ({ onViewAll }) => {
  const { colors } = useTheme();
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
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
      {categoryTotals.slice(0, 5).map((cat) => {
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
