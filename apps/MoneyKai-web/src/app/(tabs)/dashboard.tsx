import React, { useMemo, useState } from 'react';
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
import { useBadgeStore } from '@/stores/useBadgeStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { WorkspaceHeader } from '@/components/ui/WorkspaceHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { CategoryBarChart } from '@/components/charts/CategoryBarChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { QuickNotes } from '@/components/dashboard/QuickNotes';
import { NoteModal } from '@/components/dashboard/NoteModal';
import { AiAssistantPanel } from '@/components/dashboard/AiAssistantPanel';
import { LinkedAccountsSnapshot } from '@/components/accounts/LinkedAccountsSnapshot';
import { FirstLoginTour } from '@/components/onboarding/FirstLoginTour';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { BADGE_DEFINITIONS } from '@/constants/badges';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';

function SummaryCard({
  icon,
  label,
  value,
  subtitle,
  status,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  subtitle?: string;
  status?: 'neutral' | 'positive' | 'warning' | 'danger';
}) {
  const { colors } = useTheme();
  const statusColor = status === 'positive'
    ? colors.success
    : status === 'warning'
      ? colors.warning
      : status === 'danger'
        ? colors.error
        : colors.textTertiary;

  return (
    <Card variant="outlined" style={{ flex: 1, flexBasis: 220, minWidth: 220, minHeight: 140 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
        <View style={{ width: 34, height: 34, borderRadius: BorderRadius.sm, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight }}>
          <MaterialCommunityIcons name={icon} size={18} color={colors.textSecondary} />
        </View>
        <Text style={{ flex: 1, fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }} numberOfLines={2}>
          {label}
        </Text>
      </View>
      <Text
        style={{ fontSize: Typography.fontSize['2xl'], lineHeight: Typography.lineHeight['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.78}
      >
        {value}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: status ? statusColor : colors.textTertiary, marginTop: 4, lineHeight: 18 }}>
          {subtitle}
        </Text>
      ) : null}
    </Card>
  );
}

type ActivationStep = {
  done: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
  action: string;
  onPress: () => void;
};

function ActivationPanel({ steps }: { steps: ActivationStep[] }) {
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

function SpendingSnapshot({
  remaining,
  topCategory,
}: {
  remaining: number;
  topCategory?: string;
}) {
  const { colors } = useTheme();

  return (
    <Card>
      <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>
        Spending Snapshot
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        <View style={{ flex: 1, minWidth: 140, backgroundColor: colors.primaryBg, borderRadius: BorderRadius.md, padding: Spacing.md }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Remaining</Text>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            {formatCurrency(Math.max(0, remaining))}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 140, backgroundColor: colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Top category</Text>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            {topCategory || 'None yet'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

type ReviewQueueItem = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
  status: string;
  tone: 'primary' | 'warning' | 'success' | 'neutral';
  href: string;
};

function ReviewQueuePanel({ items }: { items: ReviewQueueItem[] }) {
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

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 1280;
  const user = useAuthStore((s) => s.user);
  const isHydratingSession = useAuthStore((s) => s.isHydratingSession);
  const tourCompleted = useSettingsStore((s) => s.tourCompleted);
  const tourCompletedByUserId = useSettingsStore((s) => s.tourCompletedByUserId);
  const setTourCompletedForUser = useSettingsStore((s) => s.setTourCompletedForUser);
  const { settings } = useBudgetStore();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const totalIncome = useTransactionStore((s) => s.getTotalIncome());
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const allTransactions = useTransactionStore((s) => s.transactions);
  const groups = useGroupStore((s) => s.groups);
  const challenges = useChallengeStore((s) => s.challenges);
  const { badges } = useBadgeStore();
  const unlockedBadges = badges.filter((b) => b.is_unlocked).slice(0, 6);
  const activeChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.status === 'active'),
    [challenges]
  );

  const [showNoteModal, setShowNoteModal] = useState(false);
  const tourCompletedForUser = user?.id ? (tourCompletedByUserId[user.id] ?? tourCompleted) : false;
  const showTour = Boolean(user?.id && !isHydratingSession && !tourCompletedForUser);

  const allowance = settings.monthly_allowance;
  const remaining = allowance - totalSpent;
  const budgetUsage = allowance > 0 ? (totalSpent / allowance) * 100 : 0;
  const activeGroups = groups.filter((group) => !group.archived).length;
  const firstName = user?.full_name?.split(' ')?.[0] ?? 'there';
  const netFlow = totalIncome - totalSpent;
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
      icon: budgetUsage > 80 || remaining < 0 ? 'alert-circle-outline' : 'shield-check-outline',
      title: 'Budget pressure',
      body: allowance > 0
        ? `${Math.round(budgetUsage)}% of the monthly budget is used.`
        : 'Set a monthly budget before MoneyKai can judge pressure.',
      status: remaining < 0 ? 'Over' : budgetUsage > 80 ? 'Watch' : 'OK',
      tone: remaining < 0 || budgetUsage > 80 ? 'warning' : 'success',
      href: '/budgets',
    },
    {
      icon: 'swap-horizontal',
      title: 'Money records',
      body: allTransactions.length > 0
        ? `${allTransactions.length} records feed reports, categories, and AI summaries.`
        : 'Add records before review signals appear.',
      status: allTransactions.length > 0 ? 'Ready' : 'Start',
      tone: allTransactions.length > 0 ? 'success' : 'neutral',
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
      done: allTransactions.length > 0,
      icon: 'receipt-text-plus-outline',
      title: 'Add your first record',
      body: 'Start with one income or expense. Reports need reviewed data before they can help.',
      action: 'Add transaction',
      onPress: () => router.push('/transactions' as any),
    },
    {
      done: allTransactions.length >= 3,
      icon: 'chart-box-outline',
      title: 'Review the first pattern',
      body: 'After a few records, check categories and cashflow so the app can earn your trust.',
      action: 'Review transactions',
      onPress: () => router.push('/transactions' as any),
    },
  ];
  const summaryCards = [
    {
      icon: 'wallet-outline' as const,
      label: 'Monthly Budget',
      value: formatCurrency(allowance),
      subtitle: allowance > 0 ? `${Math.round(budgetUsage)}% used this month` : 'Monthly budget not set yet',
      status: allowance > 0 ? 'neutral' as const : 'warning' as const,
    },
    {
      icon: 'arrow-up-circle-outline' as const,
      label: 'Total Spent',
      value: formatCurrency(totalSpent),
      subtitle: 'Expense total for the current month',
      status: budgetUsage > 80 ? 'warning' as const : 'neutral' as const,
    },
    {
      icon: 'cash-check' as const,
      label: 'Remaining',
      value: formatCurrency(Math.max(0, remaining)),
      subtitle: remaining < 0 ? 'Over the limit' : 'Still available to spend',
      status: remaining < 0 ? 'danger' as const : 'positive' as const,
    },
    {
      icon: 'cash-multiple' as const,
      label: 'Income',
      value: formatCurrency(totalIncome),
      subtitle: 'Tracked income for the month',
      status: 'neutral' as const,
    },
    {
      icon: 'account-group-outline' as const,
      label: 'Active Groups',
      value: String(activeGroups),
      subtitle: activeGroups > 0 ? 'Shared spending is active' : 'No active shared groups',
      status: 'neutral' as const,
    },
  ] as const;

  const completeTour = () => {
    if (user?.id) {
      setTourCompletedForUser(user.id, true);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ gap: Spacing.xl, paddingBottom: Spacing['4xl'] }}>
      <WorkspaceHeader
        icon="view-dashboard-outline"
        eyebrow="DASHBOARD"
        title={`Welcome back, ${firstName}`}
        description="Reviewed transactions, budgets, shared spending, savings, and portfolio context in one workspace."
        variant="quiet"
        metrics={[
          { label: 'Available', value: formatCurrency(Math.max(0, remaining)), tone: remaining < 0 ? 'danger' : 'positive' },
          { label: 'Spent', value: formatCurrency(totalSpent), tone: 'warning' },
          { label: 'Income', value: formatCurrency(totalIncome), tone: 'positive' },
          { label: 'Net flow', value: `${netFlow < 0 ? '-' : '+'}${formatCurrency(Math.abs(netFlow))}`, tone: netFlow < 0 ? 'danger' : 'positive' },
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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            subtitle={card.subtitle}
            status={card.status}
          />
        ))}
      </View>

      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.xl, alignItems: 'flex-start' }}>
        <View style={{ flex: 2, gap: Spacing.xl, minWidth: 0 }}>
          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.xl, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <TrendLineChart />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <CategoryBarChart />
            </View>
          </View>

          <RecentTransactions
            onViewAll={() => router.push('/transactions' as any)}
            onAddTransaction={() => router.push('/transactions' as any)}
          />

          <Card>
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>
              Recent Badges
            </Text>
            {unlockedBadges.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
                {unlockedBadges.map((badge) => {
                  const def = BADGE_DEFINITIONS.find((entry) => entry.id === badge.badge_type);
                  return (
                    <View key={badge.id} style={{ alignItems: 'center', width: 84 }}>
                      <View style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: `${def?.color || colors.primary}15`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6,
                        borderWidth: 1,
                        borderColor: `${def?.color || colors.primary}30`,
                      }}>
                        <MaterialCommunityIcons name={(def?.icon || 'medal') as any} size={22} color={def?.color || colors.primary} />
                      </View>
                      <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, textAlign: 'center' }} numberOfLines={1}>
                        {badge.name}
                      </Text>
                      <Text style={{ fontSize: 9, fontFamily: Typography.fontFamily.regular, color: colors.textTertiary, textAlign: 'center' }}>
                        {badge.unlocked_at ? formatDate(badge.unlocked_at, 'dd MMM') : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                Unlock badges by using the app consistently.
              </Text>
            )}
          </Card>

          {isWide ? (
            <View style={{ flexDirection: 'row', gap: Spacing.xl, alignItems: 'flex-start' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <QuickNotes
                  onViewAll={() => router.push('/notes' as any)}
                  onNewNote={() => setShowNoteModal(true)}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <SpendingSnapshot remaining={remaining} topCategory={categoryTotals[0]?.category} />
              </View>
            </View>
          ) : null}
        </View>

        <View style={{ flex: 1, gap: Spacing.xl, minWidth: isWide ? 380 : '100%' as any }}>
          <LinkedAccountsSnapshot />

          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Active Challenge
              </Text>
              <TouchableOpacity onPress={() => router.push('/goals' as any)} accessibilityRole="link" accessibilityLabel="View goals">
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.primary }}>
                  View Goals
                </Text>
              </TouchableOpacity>
            </View>
            {activeChallenges.length > 0 ? (
              <View style={{ gap: 10 }}>
                <View style={{ backgroundColor: colors.primaryBg, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: `${colors.primary}18` }}>
                  <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {activeChallenges[0].name}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                    Day {activeChallenges[0].current_streak} of {activeChallenges[0].duration_days}
                  </Text>
                </View>
                <ProgressBar
                  progress={(activeChallenges[0].current_streak / Math.max(1, activeChallenges[0].duration_days)) * 100}
                  showLabel
                  label="Progress"
                />
              </View>
            ) : (
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22 }}>
                No active goals yet. Start one from the Savings page when you want a simple streak to follow.
              </Text>
            )}
          </Card>

          <AiAssistantPanel />

          {!isWide ? (
            <>
              <QuickNotes
                onViewAll={() => router.push('/notes' as any)}
                onNewNote={() => setShowNoteModal(true)}
              />

              <SpendingSnapshot remaining={remaining} topCategory={categoryTotals[0]?.category} />
            </>
          ) : null}
        </View>
      </View>

      <NoteModal visible={showNoteModal} onClose={() => setShowNoteModal(false)} />

      <FirstLoginTour
        key={`${user?.id ?? 'guest'}-${showTour ? 'open' : 'closed'}`}
        visible={showTour}
        onFinish={completeTour}
        onSkip={completeTour}
      />
    </ScrollView>
  );
}
