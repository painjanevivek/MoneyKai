import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import type { DashboardCategoryCard } from '../../utils/dashboard';

type CategoryBudgetRailProps = {
  items: DashboardCategoryCard[];
};

export const CategoryBudgetRail: React.FC<CategoryBudgetRailProps> = ({ items }) => {
  const { colors } = useTheme();

  if (items.length === 0) {
    return (
      <View style={{ gap: Spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Category Limits
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
            Spent vs default budget
          </Text>
        </View>
        <Card
          style={{
            borderRadius: BorderRadius.xl,
            borderWidth: 1,
            borderColor: colors.borderLight,
            backgroundColor: colors.surface,
            gap: Spacing.sm,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            No category activity yet
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
            Add a few transactions and we&apos;ll show category budgets and progress here.
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ gap: Spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          Category Limits
        </Text>
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
          Spent vs default budget
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingVertical: 2 }}>
        {items.map((item) => {
          const overBudget = item.budget > 0 && item.spent > item.budget;
          return (
            <Card
              key={item.category}
              style={{
                width: 180,
                gap: Spacing.sm,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: overBudget ? `${colors.emergency}30` : colors.borderLight,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${item.color}12`,
                  borderWidth: 1,
                  borderColor: `${item.color}20`,
                }}
              >
                <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
              </View>
              <View>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                  {formatCurrency(item.spent)} spent
                </Text>
              </View>
              <ProgressBar progress={item.progress} color={overBudget ? colors.emergency : item.color} height={6} />
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                {formatCurrency(item.budget)} budget
              </Text>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CategoryBudgetRail;
