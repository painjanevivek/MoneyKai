import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { WorkspaceHeader } from '@/components/ui/WorkspaceHeader';
import { AnalyticsDashboard } from '@/components/dashboard/analytics';
import { useReportingMonth } from '@/components/layout/ReportingMonthContext';
import { FirstLoginTour } from '@/components/onboarding/FirstLoginTour';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { buildCashflowPlan } from '@/utils/cashflowPlan';
import { formatCurrency } from '@/utils/formatCurrency';

export type ActivationStep = {
  done: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
  action: string;
  onPress: () => void;
};

export function ActivationPanel({ steps }: { steps: ActivationStep[] }) {
  const { colors } = useTheme();
  const completed = steps.filter((step) => step.done).length;
  if (completed >= steps.length) {
    return null;
  }

  const progress = Math.round((completed / steps.length) * 100);
  const nextStep = steps.find((step) => !step.done) ?? steps[steps.length - 1];

  return (
    <Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
        <View style={{ flex: 1, minWidth: 260 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
            SETUP
          </Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
            Finish the first useful review
          </Text>
          <Text style={{ marginTop: 6, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
            Add the minimum context needed for budgets, records, and reports to read correctly.
          </Text>
        </View>
        <View style={{ minWidth: 180 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
            Setup progress
          </Text>
          <Text style={{ marginTop: 2, fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            {completed}/{steps.length}
          </Text>
          <View style={{ height: 8, borderRadius: BorderRadius.full, backgroundColor: colors.primaryBg, overflow: 'hidden', marginTop: Spacing.sm }}>
            <View style={{ height: 8, width: `${progress}%`, backgroundColor: colors.primary }} />
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.lg }}>
        {steps.map((step) => (
          <View
            key={step.title}
            style={{
              flex: 1,
              minWidth: 220,
              padding: Spacing.md,
              borderRadius: BorderRadius.sm,
              borderWidth: 1,
              borderColor: colors.borderLight,
              backgroundColor: colors.surfaceElevated,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View style={{ width: 34, height: 34, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
                <MaterialCommunityIcons name={step.done ? 'check' : step.icon} size={18} color={step.done ? colors.success : colors.textSecondary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {step.title}
                </Text>
                <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: step.done ? colors.success : colors.textTertiary }}>
                  {step.done ? 'Complete' : 'Next'}
                </Text>
              </View>
            </View>
            <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
              {step.body}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: Spacing.lg, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
        <Text style={{ flex: 1, minWidth: 240, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
          Next best action: <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{nextStep.title}</Text>
        </Text>
        <Button title={nextStep.action} onPress={nextStep.onPress} icon="arrow-right" iconPosition="right" />
      </View>
    </Card>
  );
}

export type ReviewQueueItem = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
  status: string;
  tone: 'primary' | 'warning' | 'success' | 'neutral';
  href: string;
};

export function ReviewQueuePanel({ items }: { items: ReviewQueueItem[] }) {
  const { colors } = useTheme();
  const toneColor = (tone: ReviewQueueItem['tone']) => {
    if (tone === 'warning') return colors.warning;
    if (tone === 'success') return colors.success;
    if (tone === 'primary') return colors.primary;
    return colors.textTertiary;
  };

  return (
    <Card style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
            REVIEW QUEUE
          </Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
            What needs attention
          </Text>
        </View>
        <Button title="Open Review" icon="arrow-right" iconPosition="right" size="sm" onPress={() => router.push('/ai-review' as any)} />
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight }}>
        {items.map((item, index) => {
          const color = toneColor(item.tone);
          return (
            <TouchableOpacity
              key={item.title}
              activeOpacity={0.86}
              accessibilityRole="link"
              accessibilityLabel={`Open ${item.title}`}
              onPress={() => router.push(item.href as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.md,
                paddingVertical: Spacing.md,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: colors.borderLight,
              }}
            >
              <View style={{ width: 38, height: 38, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}14` }}>
                <MaterialCommunityIcons name={item.icon} size={19} color={color} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }} numberOfLines={2}>
                  {item.body}
                </Text>
              </View>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color }}>
                {item.status}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

const toUtcCalendarKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;

const getLiteralTransactionDateKey = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, monthIndex, day));

  return year >= 1000 &&
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === monthIndex &&
    parsed.getUTCDate() === day
    ? value
    : null;
};

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 1200;
  const user = useAuthStore((state) => state.user);
  const isHydratingSession = useAuthStore((state) => state.isHydratingSession);
  const tourCompleted = useSettingsStore((state) => state.tourCompleted);
  const tourCompletedByUserId = useSettingsStore((state) => state.tourCompletedByUserId);
  const setTourCompletedForUser = useSettingsStore((state) => state.setTourCompletedForUser);
  const transactions = useTransactionStore((state) => state.transactions);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const { settings } = useBudgetStore();
  const groups = useGroupStore((state) => state.groups);
  const challenges = useChallengeStore((state) => state.challenges);
  const { selectedMonthDate } = useReportingMonth();

  const cycleStart = new Date(Date.UTC(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 1));
  const cycleEnd = new Date(Date.UTC(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 1));
  const wallClockNow = new Date();
  const reportingNow = new Date(Date.UTC(
    wallClockNow.getFullYear(),
    wallClockNow.getMonth(),
    wallClockNow.getDate(),
    12,
  ));

  const cycleStartMs = cycleStart.getTime();
  const cycleEndMs = cycleEnd.getTime();
  const reportingNowMs = reportingNow.getTime();
  const cycleStartKey = toUtcCalendarKey(cycleStart);
  const cycleEndKey = toUtcCalendarKey(cycleEnd);

  const plan = useMemo(() => buildCashflowPlan({
    transactions,
    monthlyAllowance: settings.monthly_allowance,
    challenges,
    cycleStart: new Date(cycleStartMs),
    cycleEnd: new Date(cycleEndMs),
    now: new Date(reportingNowMs),
  }), [transactions, settings.monthly_allowance, challenges, cycleStartMs, cycleEndMs, reportingNowMs]);

  const selectedCycleTransactions = useMemo(() => transactions.filter((transaction) => {
    const dateKey = getLiteralTransactionDateKey(transaction.transaction_date);
    return dateKey !== null && dateKey >= cycleStartKey && dateKey < cycleEndKey;
  }), [transactions, cycleStartKey, cycleEndKey]);

  const activeChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.status === 'active'),
    [challenges],
  );
  const activeGroups = groups.filter((group) => !group.archived).length;
  const allowance = settings.monthly_allowance;
  const budgetAvailable = plan.metrics.budgetAvailable;
  const legacyRemaining = allowance - plan.metrics.actualExpense;
  const actualNetFlow = plan.metrics.actualIncome - plan.metrics.actualExpense;
  const budgetUsage = allowance > 0
    ? Math.min(100, Math.max(0, (plan.metrics.actualExpense / allowance) * 100))
    : 0;
  const firstName = user?.full_name?.split(' ')?.[0] ?? 'there';
  const tourCompletedForUser = user?.id ? (tourCompletedByUserId[user.id] ?? tourCompleted) : false;
  const showTour = Boolean(user?.id && !isHydratingSession && !tourCompletedForUser);

  const reviewQueueItems: ReviewQueueItem[] = [
    {
      icon: 'brain',
      title: 'AI review desk',
      body: 'Review receipts, findings, and draft actions.',
      status: 'Open',
      tone: 'primary',
      href: '/ai-review',
    },
    {
      icon: budgetUsage > 80 || legacyRemaining < 0 ? 'alert-circle-outline' : 'shield-check-outline',
      title: 'Budget pressure',
      body: allowance > 0
        ? `${Math.round(budgetUsage)}% of the monthly budget is used.`
        : 'Set a monthly budget before MoneyKai can judge pressure.',
      status: legacyRemaining < 0 ? 'Over' : budgetUsage > 80 ? 'Watch' : 'OK',
      tone: legacyRemaining < 0 || budgetUsage > 80 ? 'warning' : 'success',
      href: '/budgets',
    },
    {
      icon: 'swap-horizontal',
      title: 'Money records',
      body: transactions.length > 0
        ? `${transactions.length} records feed reports, categories, and AI summaries.`
        : 'Add records before review signals appear.',
      status: transactions.length > 0 ? 'Ready' : 'Start',
      tone: transactions.length > 0 ? 'success' : 'neutral',
      href: '/transactions',
    },
    {
      icon: 'file-chart-outline',
      title: 'Monthly digest',
      body: 'Use Reports for summaries, imports, and export-ready review history.',
      status: 'Reports',
      tone: 'neutral',
      href: '/reports',
    },
  ];
  const activationSteps: ActivationStep[] = [
    {
      done: allowance > 0,
      icon: 'target',
      title: 'Set a monthly budget',
      body: 'Create the guardrail that makes every dashboard number easier to judge.',
      action: 'Set budget',
      onPress: () => router.push('/budgets' as any),
    },
    {
      done: transactions.length > 0,
      icon: 'receipt-text-plus-outline',
      title: 'Add your first record',
      body: 'Start with one income or expense. Reports need reviewed data before they can help.',
      action: 'Add transaction',
      onPress: () => router.push({ pathname: '/transactions', params: { add: 'true' } } as any),
    },
    {
      done: transactions.length >= 3,
      icon: 'chart-box-outline',
      title: 'Review the first pattern',
      body: 'After a few records, check categories and cashflow so the app can earn your trust.',
      action: 'Review transactions',
      onPress: () => router.push('/transactions' as any),
    },
  ];
  const needsActivation = transactions.length < 3;

  const completeTour = () => {
    if (user?.id) {
      setTourCompletedForUser(user.id, true);
    }
  };
  const handleViewGoals = () => router.push('/goals' as any);

  // The legacy sections remain available as focused components, while the BagUI-inspired
  // analytics composition now owns the dashboard surface.
  void isWide;
  void selectedCycleTransactions;
  void activeChallenges;
  void activeGroups;
  void budgetAvailable;
  void legacyRemaining;
  void actualNetFlow;
  void firstName;
  void reviewQueueItems;
  void activationSteps;
  void needsActivation;
  void handleViewGoals;

  return (
    <ScrollView
      testID="cashflow-dashboard"
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ gap: Spacing.lg, paddingBottom: Spacing['3xl'] }}
    >
      {needsActivation ? (
        <>
          <WorkspaceHeader
            icon="view-dashboard-outline"
            eyebrow="DASHBOARD"
            title={`Welcome back, ${firstName}`}
            description="Reviewed transactions, budgets, shared spending, savings, and portfolio context in one workspace."
            variant="quiet"
            metrics={[
              { label: 'Budget available', value: formatCurrency(budgetAvailable), tone: legacyRemaining < 0 ? 'danger' : 'positive' },
              { label: 'Spent', value: formatCurrency(plan.metrics.actualExpense), tone: 'warning' },
              { label: 'Income', value: formatCurrency(plan.metrics.actualIncome), tone: 'positive' },
              { label: 'Net flow', value: `${actualNetFlow < 0 ? '-' : '+'}${formatCurrency(Math.abs(actualNetFlow))}`, tone: actualNetFlow < 0 ? 'danger' : 'positive' },
            ]}
            chips={[
              { icon: 'calendar-refresh-outline', label: `Reset day ${settings.reset_day}` },
              { icon: 'target', label: `${activeChallenges.length} active goal${activeChallenges.length === 1 ? '' : 's'}` },
              { icon: 'account-group-outline', label: `${activeGroups} active group${activeGroups === 1 ? '' : 's'}` },
            ]}
            actions={
              <>
                <Button
                  title="Transactions"
                  onPress={() => router.push('/transactions' as any)}
                  variant="outline"
                  icon="swap-horizontal"
                  style={{ flexGrow: 1, flexShrink: 1, flexBasis: 168 }}
                />
                <Button
                  title="AI Review"
                  onPress={() => router.push('/ai-review' as any)}
                  variant="outline"
                  icon="receipt-text-outline"
                  style={{ flexGrow: 1, flexShrink: 1, flexBasis: 168 }}
                />
                <Button
                  title="Portfolio"
                  onPress={() => router.push('/portfolio' as any)}
                  variant="outline"
                  icon="briefcase-outline"
                  style={{ flexGrow: 1, flexShrink: 1, flexBasis: 168 }}
                />
              </>
            }
          />
          <ActivationPanel steps={activationSteps} />
          <ReviewQueuePanel items={reviewQueueItems} />
        </>
      ) : (
        <AnalyticsDashboard
          plan={plan}
          transactions={transactions}
          periodEnd={cycleEnd}
          userId={user?.id}
          onAddTransaction={() => router.push('/transactions' as any)}
          onAdjustBudget={() => router.push('/budgets' as any)}
          onStartGoal={() => router.push('/goals' as any)}
          onOpenAiReview={() => router.push('/ai-review' as any)}
          onOpenReports={() => router.push('/reports' as any)}
          onViewTransactions={() => router.push('/transactions' as any)}
          onUpdateTransactionCategory={(transactionIds, categoryId) => {
            transactionIds.forEach((transactionId) => updateTransaction(transactionId, { category: categoryId }));
          }}
        />
      )}

      <FirstLoginTour
        key={`${user?.id ?? 'guest'}-${showTour ? 'open' : 'closed'}`}
        visible={showTour}
        onFinish={completeTour}
        onSkip={completeTour}
      />
    </ScrollView>
  );
}
