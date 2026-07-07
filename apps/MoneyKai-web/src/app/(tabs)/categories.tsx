import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { getCategoryById } from '@/constants/categories';
import { Typography, Spacing } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());

  const topCategories = useMemo(() => categoryTotals.slice(0, 8), [categoryTotals]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['4xl'] }}
      >
        <View style={{ gap: Spacing.xl }}>
          <Card>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Categories
            </Text>
            <Text style={{ marginTop: 6, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22, maxWidth: 760 }}>
              See how your money is distributed across the categories MoneyKai already knows from your transaction history.
            </Text>
          </Card>

          {topCategories.length > 0 ? (
            <Card>
              <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>
                Spending by category
              </Text>
              <View style={{ gap: Spacing.md }}>
                {topCategories.map((item) => {
                  const category = getCategoryById(item.category);
                  return (
                    <View
                      key={item.category}
                      style={{
                        backgroundColor: 'transparent',
                        borderRadius: 0,
                        borderBottomWidth: 1,
                        borderColor: colors.borderLight,
                        paddingVertical: Spacing.md,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: Spacing.sm }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: category?.colorLight || colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialCommunityIcons name={(category?.icon || 'shape-outline') as any} size={18} color={category?.color || colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                              {category?.name || item.category}
                            </Text>
                            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
                              {item.count} transaction{item.count === 1 ? '' : 's'}
                            </Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                            {formatCurrency(item.total)}
                          </Text>
                          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                            {Math.round(item.percentage)}% of total spend
                          </Text>
                        </View>
                      </View>
                      <ProgressBar progress={item.percentage} color={category?.color || colors.primary} />
                    </View>
                  );
                })}
              </View>
            </Card>
          ) : (
            <EmptyState
              icon="shape-outline"
              title="No category data yet"
              message="Add a few transactions and MoneyKai will automatically build the category view."
              action={<Button title="Open Transactions" onPress={() => router.push('/transactions' as any)} />}
            />
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            <Card style={{ flex: 1, minWidth: 220 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Total spend tracked</Text>
              <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary, marginTop: 4 }}>
                {formatCurrency(totalSpent)}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 220 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Categories used</Text>
              <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary, marginTop: 4 }}>
                {categoryTotals.length}
              </Text>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
