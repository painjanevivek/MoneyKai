import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { MonthlyBudgetSummaryCard } from '@/components/dashboard/MonthlyBudgetSummaryCard';
import { SpendingPieChart } from '@/components/charts/SpendingPieChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { SavingsGoalCard } from '@/components/dashboard/SavingsGoalCard';
import { CategoryBudgetRail } from '@/components/dashboard/CategoryBudgetRail';
import { MonthYearPickerSheet } from '@/components/calendar/MonthYearPickerSheet';
import { DashboardCalendarButton } from '@/components/dashboard/DashboardCalendarButton';
import { FirstLoginTour } from '@/components/onboarding/FirstLoginTour';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  buildCategoryBudgetCards,
  buildDashboardInsight,
  buildSavingsGoalSnapshot,
  filterTransactionsByMonth,
  getMonthLabel,
  getPreviousMonthKey,
} from '@/utils/dashboard';
import { getMonthSummary } from '@/utils/monthAnalytics';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isHydratingSession = useAuthStore((s) => s.isHydratingSession);
  const tourCompleted = useSettingsStore((s) => s.tourCompleted);
  const tourCompletedByUserId = useSettingsStore((s) => s.tourCompletedByUserId);
  const setTourCompletedForUser = useSettingsStore((s) => s.setTourCompletedForUser);
  const transactions = useTransactionStore((s) => s.transactions);
  const { settings } = useBudgetStore();
  const selectedMonthKey = useCalendarStore((s) => s.selectedMonthKey);
  const setSelectedMonthKey = useCalendarStore((s) => s.setSelectedMonthKey);
  const resetToCurrentMonth = useCalendarStore((s) => s.resetToCurrentMonth);
  const activeChallenges = useChallengeStore((s) => s.getActiveChallenges());

  const [showMonthMenu, setShowMonthMenu] = useState(false);

  const tourCompletedForUser = user?.id ? (tourCompletedByUserId[user.id] ?? tourCompleted) : false;
  const showTour = Boolean(user?.id && !isHydratingSession && !tourCompletedForUser);

  const selectedMonthLabel = useMemo(() => getMonthLabel(selectedMonthKey), [selectedMonthKey]);

  const monthSummary = useMemo(() => getMonthSummary(transactions, selectedMonthKey), [transactions, selectedMonthKey]);
  const monthTransactions = monthSummary.transactions;

  const previousMonthKey = useMemo(() => getPreviousMonthKey(selectedMonthKey), [selectedMonthKey]);
  const previousMonthTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, previousMonthKey),
    [transactions, previousMonthKey]
  );

  const monthCategoryTotals = monthSummary.categoryTotals;
  const categoryCards = useMemo(
    () => buildCategoryBudgetCards(monthCategoryTotals, settings.category_limits),
    [monthCategoryTotals, settings.category_limits]
  );

  const monthExpenseTotal = monthSummary.expenses;
  const previousMonthExpenseTotal = useMemo(
    () =>
      previousMonthTransactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [previousMonthTransactions]
  );

  const monthlyAllowance = settings.monthly_allowance;
  const remaining = monthlyAllowance - monthExpenseTotal;
  const budgetProgress = monthlyAllowance > 0 ? (monthExpenseTotal / monthlyAllowance) * 100 : 0;
  const firstName = user?.full_name?.split(' ')?.[0] || 'there';
  const netCashflow = monthSummary.income - monthExpenseTotal;
  const remainingLabel = remaining < 0 ? 'Over budget by' : 'Available after spend';
  const dashboardInsight = useMemo(
    () => buildDashboardInsight(monthExpenseTotal, previousMonthExpenseTotal, monthlyAllowance),
    [monthExpenseTotal, previousMonthExpenseTotal, monthlyAllowance]
  );
  const showDashboardInsight = dashboardInsight.title !== 'Set your monthly budget';
  const savingsSnapshot = useMemo(
    () => buildSavingsGoalSnapshot(activeChallenges[0], monthlyAllowance, remaining),
    [activeChallenges, monthlyAllowance, remaining]
  );

  const completeTour = () => {
    if (user?.id) {
      setTourCompletedForUser(user.id, true);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing['2xl'] }}
      >
        <View
          style={{
            paddingHorizontal: Spacing.base,
            paddingTop: Spacing.md,
            paddingBottom: Spacing.base,
            gap: Spacing.sm,
          }}
        >
          <View
            style={{
              borderRadius: BorderRadius['2xl'],
              padding: Spacing.lg,
              backgroundColor: colors.primaryDark,
              borderWidth: 1,
              borderColor: `${colors.primaryLight}30`,
              overflow: 'hidden',
              ...Shadows.lg,
              shadowColor: colors.shadowColor,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.24)',
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 72,
                width: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.xs,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: 'rgba(255, 255, 255, 0.72)',
                  }}
                >
                  MONEYKAI LEDGER
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: Typography.fontSize['2xl'],
                    lineHeight: 31,
                    fontFamily: Typography.fontFamily.display,
                    color: '#FFFFFF',
                  }}
                >
                  Hi {firstName}, your month is in view
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Open notifications"
                  activeOpacity={0.82}
                  onPress={() => router.push('/(tabs)/notifications' as never)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: BorderRadius.sm,
                    backgroundColor: 'rgba(255, 255, 255, 0.13)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.18)',
                  }}
                >
                  <MaterialCommunityIcons name="bell-outline" size={21} color="#FFFFFF" />
                </TouchableOpacity>

                <DashboardCalendarButton monthLabel={selectedMonthLabel} onPress={() => setShowMonthMenu(true)} inverted />
              </View>
            </View>

            <View style={{ marginTop: Spacing.xl }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: 'rgba(255, 255, 255, 0.68)' }}>
                {remainingLabel}
              </Text>
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={{
                  marginTop: 4,
                  fontSize: 42,
                  lineHeight: 48,
                  fontFamily: Typography.fontFamily.bold,
                  color: remaining < 0 ? '#FFE1E5' : '#FFFFFF',
                }}
              >
                {formatCurrency(Math.abs(remaining))}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg }}>
              <View
                style={{
                  flex: 1,
                  padding: Spacing.md,
                  borderRadius: BorderRadius.md,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.13)',
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.xs, color: 'rgba(255, 255, 255, 0.64)' }}>Spent</Text>
                <Text style={{ marginTop: 2, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' }}>
                  {formatCurrency(monthExpenseTotal)}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: Spacing.md,
                  borderRadius: BorderRadius.md,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.13)',
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.xs, color: 'rgba(255, 255, 255, 0.64)' }}>Net flow</Text>
                <Text style={{ marginTop: 2, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: netCashflow < 0 ? '#FFE1E5' : '#D9FFF2' }}>
                  {netCashflow < 0 ? '-' : '+'}
                  {formatCurrency(Math.abs(netCashflow))}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg }}>
              {[
                ['shield-check-outline', 'User-controlled data'],
                ['cloud-check-outline', 'Backup ready'],
                ['chart-timeline-variant', selectedMonthLabel],
              ].map(([icon, label]) => (
                <View
                  key={label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 7,
                    borderRadius: BorderRadius.full,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <MaterialCommunityIcons name={icon as any} size={14} color="rgba(255, 255, 255, 0.82)" />
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: 'rgba(255, 255, 255, 0.82)' }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <MonthlyBudgetSummaryCard
            monthLabel={selectedMonthLabel}
            monthlyAllowance={monthlyAllowance}
            spent={monthExpenseTotal}
            remaining={remaining}
            progress={budgetProgress}
          />
        </View>

        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <SpendingPieChart
            categoryTotals={monthCategoryTotals}
            totalSpent={monthExpenseTotal}
            onPressViewMore={() => router.push('/(tabs)/budget' as never)}
          />
        </View>

        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <CategoryBudgetRail items={categoryCards} />
        </View>

        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <SavingsGoalCard
            title={savingsSnapshot.title}
            subtitle={savingsSnapshot.subtitle}
            current={savingsSnapshot.current}
            target={savingsSnapshot.target}
            progress={savingsSnapshot.progress}
            icon={savingsSnapshot.icon}
            color={savingsSnapshot.color}
            onPress={() => router.push('/(tabs)/savings' as never)}
          />
        </View>

        {showDashboardInsight ? (
          <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
            <View
              style={{
                marginTop: 0,
                padding: Spacing.md,
                borderRadius: BorderRadius.lg,
                backgroundColor: dashboardInsight.tone === 'warning' ? colors.emergencyBg : colors.surface,
                borderWidth: 1,
                borderColor: dashboardInsight.tone === 'warning' ? `${colors.emergency}20` : colors.borderLight,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: Spacing.sm,
              }}
            >
              <MaterialCommunityIcons
                name={dashboardInsight.icon as any}
                size={18}
                color={dashboardInsight.tone === 'warning' ? colors.emergency : colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.textPrimary,
                  }}
                >
                  {dashboardInsight.title}
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: Typography.fontSize.xs,
                    color: colors.textSecondary,
                    lineHeight: 18,
                  }}
                >
                  {dashboardInsight.body}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <RecentTransactions
            transactions={monthTransactions.slice(0, 5)}
            onViewAll={() => router.push('/(tabs)/transactions' as never)}
          />
        </View>
      </ScrollView>

      <MonthYearPickerSheet
        visible={showMonthMenu}
        onClose={() => setShowMonthMenu(false)}
        selectedMonthKey={selectedMonthKey}
        onSelect={setSelectedMonthKey}
        onResetToCurrentMonth={resetToCurrentMonth}
      />

      <FirstLoginTour
        key={`${user?.id ?? 'guest'}-${showTour ? 'open' : 'closed'}`}
        visible={showTour}
        onFinish={completeTour}
        onSkip={completeTour}
      />
    </SafeAreaView>
  );
}
