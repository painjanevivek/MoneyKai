import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, PanResponder } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { MonthlyBudgetSummaryCard } from '@/components/dashboard/MonthlyBudgetSummaryCard';
import { SpendingPieChart } from '@/components/charts/SpendingPieChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { SavingsGoalCard } from '@/components/dashboard/SavingsGoalCard';
import { CategoryBudgetRail } from '@/components/dashboard/CategoryBudgetRail';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { FirstLoginTour } from '@/components/onboarding/FirstLoginTour';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { getLastSixMonths } from '@/utils/dateUtils';
import {
  buildCategoryBudgetCards,
  buildCategoryTotals,
  buildDashboardInsight,
  buildSavingsGoalSnapshot,
  filterTransactionsByMonth,
  getMonthKey,
  getMonthLabel,
  getPreviousMonthKey,
} from '@/utils/dashboard';

const MENU_ACTIONS = [
  { label: 'Notifications', icon: 'bell-outline', route: '/(tabs)/notifications' as const },
  { label: 'Transaction Capture', icon: 'text-box-check-outline', route: '/(tabs)/auto-capture' as const },
  { label: 'Notes', icon: 'note-text-outline', route: '/(tabs)/notes' as const },
  { label: 'Groups', icon: 'account-group-outline', route: '/(tabs)/groups' as const },
  { label: 'Settings', icon: 'cog-outline', route: '/(tabs)/settings' as const },
  { label: 'Support', icon: 'help-circle-outline', route: '/contact' as const },
];

export default function DashboardScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isHydratingSession = useAuthStore((s) => s.isHydratingSession);
  const signOut = useAuthStore((s) => s.signOut);
  const tourCompleted = useSettingsStore((s) => s.tourCompleted);
  const tourCompletedByUserId = useSettingsStore((s) => s.tourCompletedByUserId);
  const setTourCompletedForUser = useSettingsStore((s) => s.setTourCompletedForUser);
  const transactions = useTransactionStore((s) => s.transactions);
  const { settings } = useBudgetStore();
  const activeChallenges = useChallengeStore((s) => s.getActiveChallenges());

  const months = useMemo(() => getLastSixMonths(), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => months[months.length - 1]?.key ?? getMonthKey(new Date()));
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const openMenuFromSwipe = React.useCallback(() => {
    setShowMenuSheet(true);
  }, []);
  const homeMenuPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (event, gestureState) => {
          const startedNearLeftEdge = event.nativeEvent.pageX <= 72;
          const isRightSwipe = gestureState.dx > 18 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.4;
          return startedNearLeftEdge && isRightSwipe && !showMenuSheet && !showMonthMenu;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 72 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2) {
            openMenuFromSwipe();
          }
        },
      }),
    [openMenuFromSwipe, showMenuSheet, showMonthMenu]
  );

  const tourCompletedForUser = user?.id ? (tourCompletedByUserId[user.id] ?? tourCompleted) : false;
  const showTour = Boolean(user?.id && !isHydratingSession && !tourCompletedForUser);

  const selectedMonthLabel = useMemo(() => getMonthLabel(selectedMonthKey), [selectedMonthKey]);

  const monthTransactions = useMemo(
    () =>
      [...filterTransactionsByMonth(transactions, selectedMonthKey)].sort(
        (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      ),
    [transactions, selectedMonthKey]
  );

  const previousMonthKey = useMemo(() => getPreviousMonthKey(selectedMonthKey), [selectedMonthKey]);
  const previousMonthTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, previousMonthKey),
    [transactions, previousMonthKey]
  );

  const monthCategoryTotals = useMemo(() => buildCategoryTotals(monthTransactions), [monthTransactions]);
  const categoryCards = useMemo(
    () => buildCategoryBudgetCards(monthCategoryTotals, settings.category_limits),
    [monthCategoryTotals, settings.category_limits]
  );

  const monthExpenseTotal = useMemo(
    () =>
      monthTransactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [monthTransactions]
  );
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

  const handleSignOut = async () => {
    setShowMenuSheet(false);
    await signOut();
    router.replace('/login');
  };

  const monthTiles = (
    <View style={{ gap: Spacing.sm }}>
      {months.map((month) => {
        const active = month.key === selectedMonthKey;

        return (
          <TouchableOpacity
            key={month.key}
            onPress={() => {
              setSelectedMonthKey(month.key);
              setShowMonthMenu(false);
            }}
            style={{
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primaryBg : colors.surface,
            }}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.base,
                fontFamily: Typography.fontFamily.medium,
                color: active ? colors.primary : colors.textPrimary,
              }}
            >
              {month.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']} {...homeMenuPanResponder.panHandlers}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <TouchableOpacity
              onPress={() => setShowMenuSheet(true)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
                ...Shadows.sm,
                shadowColor: colors.shadowColor,
              }}
            >
              <MaterialCommunityIcons name="menu" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.xl,
                  fontFamily: Typography.fontFamily.display,
                  color: colors.textPrimary,
                }}
              >
                MoneyKai
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  color: colors.textSecondary,
                }}
              >
                {selectedMonthLabel}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/notifications' as never)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
                ...Shadows.sm,
                shadowColor: colors.shadowColor,
              }}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setShowMonthMenu(true)}
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: Spacing.md,
              paddingVertical: 8,
              borderRadius: BorderRadius.full,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={16} color={colors.primary} />
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                fontFamily: Typography.fontFamily.semiBold,
                color: colors.textSecondary,
              }}
            >
              Viewing {selectedMonthLabel}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
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

      <ModalSheet
        visible={showMonthMenu}
        title="Select Month"
        subtitle="Choose from the last six months."
        onClose={() => setShowMonthMenu(false)}
      >
        {monthTiles}
      </ModalSheet>

      <ModalSheet
        visible={showMenuSheet}
        title="MoneyKai Menu"
        subtitle={user?.email || 'Account and quick actions'}
        onClose={() => setShowMenuSheet(false)}
        presentation="side"
        footer={
          <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
            <Button title="Sign Out" onPress={handleSignOut} variant="danger" fullWidth />
          </View>
        }
      >
        <View style={{ gap: Spacing.base }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.md,
              padding: Spacing.md,
              borderRadius: BorderRadius.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          >
            <UserAvatar name={user?.full_name} email={user?.email} avatarUrl={user?.avatar_url} size={52} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textPrimary,
                }}
              >
                {user?.full_name || 'Your profile'}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                {user?.email || 'No email available'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {MENU_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.route}
                onPress={() => {
                  setShowMenuSheet(false);
                  router.push(action.route as never);
                }}
                style={{
                  flexBasis: '48%',
                  flexGrow: 1,
                  minHeight: 70,
                  padding: Spacing.md,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <MaterialCommunityIcons name={action.icon as any} size={20} color={colors.primary} />
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    fontFamily: Typography.fontFamily.medium,
                    color: colors.textPrimary,
                  }}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ModalSheet>

      <FirstLoginTour
        key={`${user?.id ?? 'guest'}-${showTour ? 'open' : 'closed'}`}
        visible={showTour}
        onFinish={completeTour}
        onSkip={completeTour}
      />
    </SafeAreaView>
  );
}
