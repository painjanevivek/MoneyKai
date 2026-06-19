import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { getCategoryById } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatCurrency';
import { Typography, Spacing } from '../../constants/theme';

export const CategoryBarChart: React.FC<{ onViewAll?: () => void }> = ({ onViewAll }) => {
  const { colors } = useTheme();
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const maxTotal = categoryTotals.length > 0 ? categoryTotals[0].total : 1;

  return (
    <Card style={{ minHeight: 300 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text style={{
          fontSize: Typography.fontSize.md,
          fontFamily: Typography.fontFamily.semiBold,
          color: colors.textPrimary,
        }}>Top Categories</Text>
        {onViewAll ? (
          <TouchableOpacity onPress={onViewAll} accessibilityRole="button" accessibilityLabel="View all categories">
            <Text style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.medium,
              color: colors.primary,
            }}>View All</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {categoryTotals.length === 0 ? (
        <EmptyState
          icon="shape-outline"
          title="No category spending yet"
          message="Expense categories appear after you add transactions."
          style={{ paddingVertical: Spacing.xl }}
        />
      ) : (
        <View style={{ flex: 1, minHeight: 210, justifyContent: 'space-between', gap: Spacing.sm }}>
          {categoryTotals.slice(0, 5).map((cat) => {
            const category = getCategoryById(cat.category);
            const barWidth = (cat.total / maxTotal) * 100;
            return (
              <View key={cat.category} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <MaterialCommunityIcons
                      name={(category?.icon || 'help-circle-outline') as any}
                      size={16}
                      color={category?.color || colors.textSecondary}
                    />
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: Typography.fontSize.sm,
                        fontFamily: Typography.fontFamily.medium,
                        color: colors.textPrimary,
                      }}
                    >
                      {category?.name?.split(' &')[0] || cat.category}
                    </Text>
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
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.borderLight,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    height: '100%',
                    width: `${barWidth}%`,
                    borderRadius: 4,
                    backgroundColor: category?.color || colors.primary,
                  }} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
};

export default CategoryBarChart;
