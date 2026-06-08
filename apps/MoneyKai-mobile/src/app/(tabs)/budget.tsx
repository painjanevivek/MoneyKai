import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
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
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { filterTransactionsByMonth, getMonthKey, getMonthLabel, buildCategoryTotals, buildCategoryBudgetCards } from '@/utils/dashboard';

export default function BudgetScreen() {
  const { colors } = useTheme();
  const { settings } = useBudgetStore();
  const transactions = useTransactionStore((s) => s.transactions);

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
    () => buildCategoryBudgetCards(monthCategoryTotals, settings.monthly_allowance),
    [monthCategoryTotals, settings.monthly_allowance]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
          Budget
        </Text>
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
          Budget controls and month-aware summaries
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <MonthlyBudgetSummaryCard
          monthLabel={monthLabel}
          monthlyAllowance={settings.monthly_allowance}
          spent={monthExpenses}
          remaining={monthRemaining}
          progress={monthProgress}
        />

        <View style={{ height: Spacing.base }} />
        <BudgetHealth totalSpent={monthExpenses} />

        <View style={{ height: Spacing.base }} />
        <MonthlyReset />

        <View style={{ height: Spacing.base }} />
        <SpendingPieChart
          categoryTotals={monthCategoryTotals}
          totalSpent={monthExpenses}
          onPressViewMore={() => router.push('/(tabs)/savings')}
        />

        <View style={{ height: Spacing.base }} />
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
              <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Quick Budget Actions
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
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

        <View style={{ height: Spacing.base }} />
        <CategoryBudgetRail items={categoryCards} />
      </ScrollView>
    </SafeAreaView>
  );
}
