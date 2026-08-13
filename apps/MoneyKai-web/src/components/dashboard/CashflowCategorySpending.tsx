import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getCategoryById } from '../../constants/categories';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import type { CategoryTotal } from '../../types/transaction';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

interface CashflowCategorySpendingProps {
  categories: CategoryTotal[];
  onViewAll: () => void;
}

const humanize = (value: string) => value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export function CashflowCategorySpending({ categories, onViewAll }: CashflowCategorySpendingProps) {
  const { colors } = useTheme();
  const visibleCategories = [...categories]
    .sort((left, right) => right.total - left.total || left.category.localeCompare(right.category))
    .slice(0, 5);
  const barColors = [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart6];

  return (
    <View testID="category-spending" style={styles.root}>
      <Card variant="glass" padding="md" style={styles.card}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>Budget by category</Text>
          <Button title="View all" variant="ghost" size="sm" onPress={onViewAll} />
        </View>

        {visibleCategories.length === 0 ? (
          <EmptyState
            icon="shape-outline"
            title="No category spending yet"
            message="Reviewed expenses in this reporting period will appear here."
            style={styles.emptyState}
          />
        ) : (
          <View accessibilityRole="list" style={styles.list}>
            {visibleCategories.map((item, index) => {
              const category = getCategoryById(item.category);
              const categoryName = category?.name ?? humanize(item.category);
              const percentage = Math.min(100, Math.max(0, item.percentage));
              const barColor = barColors[index % barColors.length];

              return (
                <View
                  key={item.category}
                  accessibilityRole="summary"
                  accessibilityLabel={`${categoryName}: ${formatCurrency(item.total)}, ${Math.round(percentage)} percent of spending.`}
                  style={styles.row}
                >
                  <View style={styles.topline}>
                    <View style={styles.categoryIdentity}>
                      <MaterialCommunityIcons
                        name={(category?.icon ?? 'shape-outline') as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={17}
                        color={barColor}
                      />
                      <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={1}>{categoryName}</Text>
                    </View>
                    <View style={styles.values}>
                      <Text style={[styles.amount, { color: colors.textPrimary }]} numberOfLines={1}>{formatCurrency(item.total)}</Text>
                      <Text style={[styles.percentage, { color: colors.textTertiary }]}>{Math.round(percentage)}%</Text>
                    </View>
                  </View>
                  <View
                    accessibilityRole="progressbar"
                    accessibilityValue={{ min: 0, max: 100, now: Math.round(percentage) }}
                    style={[styles.track, { backgroundColor: colors.borderLight }]}
                  >
                    <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minWidth: 0 },
  card: { flex: 1, minWidth: 0 },
  header: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: 2 },
  title: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.md, lineHeight: Typography.lineHeight.md, fontFamily: Typography.fontFamily.semiBold },
  list: { gap: 4, paddingVertical: 2 },
  row: { gap: 3, minWidth: 0 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, minWidth: 0 },
  categoryIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  categoryName: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, fontFamily: Typography.fontFamily.medium },
  values: { maxWidth: '52%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.xs },
  amount: { flexShrink: 1, minWidth: 0, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, fontFamily: Typography.fontFamily.semiBold },
  percentage: { fontSize: Typography.fontSize.xs, lineHeight: Typography.lineHeight.xs, fontFamily: Typography.fontFamily.medium },
  track: { height: 4, borderRadius: BorderRadius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: BorderRadius.full },
  emptyState: { paddingVertical: Spacing.xl },
});

export default CashflowCategorySpending;
