import React, { useMemo, useState } from 'react';
import { Alert, View, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { MonthlyReset } from '@/components/dashboard/MonthlyReset';
import { BudgetHealth } from '@/components/dashboard/BudgetHealth';
import { MonthlyBudgetSummaryCard } from '@/components/dashboard/MonthlyBudgetSummaryCard';
import { CategoryBudgetRail } from '@/components/dashboard/CategoryBudgetRail';
import { SpendingPieChart } from '@/components/charts/SpendingPieChart';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EXPENSE_CATEGORIES } from '@/constants/categories';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { filterTransactionsByMonth, getMonthKey, getMonthLabel, buildCategoryTotals, buildCategoryBudgetCards } from '@/utils/dashboard';
import { formatCurrency } from '@/utils/formatCurrency';

const buildCategoryLimitInputs = (limits: Record<string, number> = {}) =>
  EXPENSE_CATEGORIES.reduce<Record<string, string>>((acc, category) => {
    const value = limits[category.id];
    acc[category.id] = value && value > 0 ? String(value) : '';
    return acc;
  }, {});

export default function BudgetScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings } = useBudgetStore();
  const transactions = useTransactionStore((s) => s.transactions);
  const [categoryLimitDrafts, setCategoryLimitDrafts] = useState<Record<string, string>>({});

  const monthKey = getMonthKey(new Date());
  const monthLabel = getMonthLabel(monthKey);
  const monthTransactions = useMemo(() => filterTransactionsByMonth(transactions, monthKey), [transactions, monthKey]);
  const monthCategoryTotals = useMemo(() => buildCategoryTotals(monthTransactions), [monthTransactions]);
  const monthExpenses = useMemo(
    () => monthTransactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0),
    [monthTransactions]
  );
  const monthRemaining = settings.monthly_allowance - monthExpenses;
  const monthProgress = settings.monthly_allowance > 0 ? (monthExpenses / settings.monthly_allowance) * 100 : 0;
  const categoryCards = useMemo(
    () => buildCategoryBudgetCards(monthCategoryTotals, settings.category_limits),
    [monthCategoryTotals, settings.category_limits]
  );
  const setCategoryLimitInput = (categoryId: string, value: string) => {
    setCategoryLimitDrafts((current) => ({
      ...current,
      [categoryId]: value.replace(/[^0-9.]/g, ''),
    }));
  };
  const hasSavedCategoryLimits = Object.values(settings.category_limits ?? {}).some((value) => value > 0);
  const savedCategoryLimitInputs = useMemo(() => buildCategoryLimitInputs(settings.category_limits), [settings.category_limits]);
  const getCategoryLimitInput = (categoryId: string) => categoryLimitDrafts[categoryId] ?? savedCategoryLimitInputs[categoryId] ?? '';

  const handleSaveCategoryLimits = () => {
    const nextLimits: Record<string, number> = {};

    for (const category of EXPENSE_CATEGORIES) {
      const rawValue = getCategoryLimitInput(category.id).trim();
      if (!rawValue) continue;

      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
        Alert.alert('Invalid limit', `Enter a valid amount for ${category.name}.`);
        return;
      }

      if (parsed > 0) {
        nextLimits[category.id] = Math.round(parsed);
      }
    }

    updateSettings({ category_limits: nextLimits });
    setCategoryLimitDrafts({});
    Alert.alert('Category limits saved', 'Your optional category limits are now active for this budget.');
  };

  const handleClearCategoryLimits = () => {
    setCategoryLimitDrafts({});
    updateSettings({ category_limits: {} });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.base }}>
        <Text style={{ fontSize: Typography.fontSize.xl, lineHeight: 28, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
          Budget
        </Text>
        <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
          Budget controls and month-aware summaries
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'], gap: Spacing.base }} showsVerticalScrollIndicator={false}>
        <MonthlyBudgetSummaryCard
          monthLabel={monthLabel}
          monthlyAllowance={settings.monthly_allowance}
          spent={monthExpenses}
          remaining={monthRemaining}
          progress={monthProgress}
        />

        <BudgetHealth totalSpent={monthExpenses} />

        <MonthlyReset />

        <Card
          style={{
            gap: Spacing.md,
            borderRadius: BorderRadius['2xl'],
            borderWidth: 1,
            borderColor: colors.borderLight,
            ...Shadows.md,
            shadowColor: colors.shadowColor,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 22, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Category Limits
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                Optional monthly limits for each expense category
              </Text>
            </View>
            <MaterialCommunityIcons name="tune-variant" size={22} color={colors.primary} />
          </View>

          <View style={{ gap: Spacing.sm }}>
            {EXPENSE_CATEGORIES.map((category, index) => {
              const spent = monthCategoryTotals.find((item) => item.category === category.id)?.total ?? 0;
              return (
                <View
                  key={category.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.sm,
                    minHeight: 58,
                    paddingVertical: Spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: index === EXPENSE_CATEGORIES.length - 1 ? 'transparent' : colors.borderLight,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: BorderRadius.sm,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: category.colorLight,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                    }}
                  >
                    <MaterialCommunityIcons name={category.icon as any} size={19} color={category.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: Typography.fontSize.sm, lineHeight: 18, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}
                    >
                      {category.name}
                    </Text>
                    <Text numberOfLines={1} style={{ fontSize: Typography.fontSize.xs, lineHeight: 16, color: colors.textSecondary }}>
                      {formatCurrency(spent)} spent this month
                    </Text>
                  </View>
                  <Input
                    value={getCategoryLimitInput(category.id)}
                    onChangeText={(value) => setCategoryLimitInput(category.id, value)}
                    placeholder="No limit"
                    keyboardType="numeric"
                    prefix="Rs"
                    maxLength={8}
                    style={{ width: 132, marginBottom: 0 }}
                    inputStyle={{ fontSize: Typography.fontSize.sm }}
                  />
                </View>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {hasSavedCategoryLimits ? (
              <Button title="Clear" icon="close" onPress={handleClearCategoryLimits} variant="outline" style={{ flex: 1 }} />
            ) : null}
            <Button title="Save Limits" icon="content-save-outline" onPress={handleSaveCategoryLimits} style={{ flex: 1 }} />
          </View>
        </Card>

        <SpendingPieChart
          categoryTotals={monthCategoryTotals}
          totalSpent={monthExpenses}
          onPressViewMore={() => router.push('/(tabs)/savings')}
        />

        <Card
          style={{
            gap: Spacing.md,
            borderRadius: BorderRadius['2xl'],
            borderWidth: 1,
            borderColor: colors.borderLight,
            ...Shadows.md,
            shadowColor: colors.shadowColor,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 22, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Quick Budget Actions
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                Jump into common budget tasks
              </Text>
            </View>
            <MaterialCommunityIcons name="wallet-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Button title="Transactions" onPress={() => router.push('/(tabs)/transactions')} variant="outline" style={{ flex: 1 }} />
            <Button title="Savings" onPress={() => router.push('/(tabs)/savings')} style={{ flex: 1 }} />
          </View>
        </Card>

        <CategoryBudgetRail items={categoryCards} />
      </ScrollView>
    </SafeAreaView>
  );
}
