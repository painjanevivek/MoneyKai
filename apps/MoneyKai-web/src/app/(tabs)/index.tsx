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
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { CategoryBarChart } from '@/components/charts/CategoryBarChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { QuickNotes } from '@/components/dashboard/QuickNotes';
import { NoteModal } from '@/components/dashboard/NoteModal';
import { BudgetHealth } from '@/components/dashboard/BudgetHealth';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { EmergencyWidget } from '@/components/dashboard/EmergencyWidget';
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
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();

  return (
    <Card style={{ flex: 1, minWidth: 220 }}>
      <View style={{ width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm }}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
        {label}
      </Text>
      <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary, marginTop: 4 }}>
        {value}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: colors.textTertiary, marginTop: 4, lineHeight: 18 }}>
          {subtitle}
        </Text>
      ) : null}
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
  const { settings, isEmergencyMode } = useBudgetStore();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const totalIncome = useTransactionStore((s) => s.getTotalIncome());
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
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
  const budgetHealthLabel =
    allowance <= 0
      ? 'Set your monthly budget in Settings'
      : remaining < 0
        ? 'You are over budget'
        : budgetUsage >= 80
          ? 'Budget is getting tight'
          : 'You are tracking well';

  const summaryCards = [
    {
      icon: 'wallet-outline' as const,
      label: 'Monthly Budget',
      value: formatCurrency(allowance),
      subtitle: allowance > 0 ? `${Math.round(budgetUsage)}% used this month` : 'Monthly budget not set yet',
    },
    {
      icon: 'arrow-up-circle-outline' as const,
      label: 'Total Spent',
      value: formatCurrency(totalSpent),
      subtitle: 'Expense total for the current month',
    },
    {
      icon: 'cash-check' as const,
      label: 'Remaining',
      value: formatCurrency(Math.max(0, remaining)),
      subtitle: remaining < 0 ? 'Over the limit' : 'Still available to spend',
    },
    {
      icon: 'cash-multiple' as const,
      label: 'Income',
      value: formatCurrency(totalIncome),
      subtitle: 'Tracked income for the month',
    },
    {
      icon: 'account-group-outline' as const,
      label: 'Active Groups',
      value: String(activeGroups),
      subtitle: activeGroups > 0 ? 'Shared spending is active' : 'No active shared groups',
    },
  ] as const;

  const completeTour = () => {
    if (user?.id) {
      setTourCompletedForUser(user.id, true);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xl, paddingBottom: Spacing['4xl'] }}>
      <Card>
        <View style={{ flexDirection: isWide ? 'row' : 'column', alignItems: isWide ? 'center' : 'stretch', justifyContent: 'space-between', gap: Spacing.lg }}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ fontSize: Typography.fontSize['3xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Welcome back, {firstName}
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22, maxWidth: 740 }}>
              This is your desktop workspace for budgeting, transactions, shared spending, savings, and financial first aid.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Button title="Open Transactions" onPress={() => router.push('/transactions' as any)} />
              <Button title="Open Groups" onPress={() => router.push('/groups' as any)} variant="outline" />
            </View>
          </View>

          <View style={{ minWidth: isWide ? 280 : '100%' as any, gap: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: isWide ? 'flex-end' : 'flex-start' }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: isEmergencyMode ? colors.emergency : colors.primary }} />
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                {budgetHealthLabel}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: isWide ? 'flex-end' : 'flex-start' }}>
              <View style={{ paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: BorderRadius.full, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.borderLight }}>
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                  Reset day {settings.reset_day}
                </Text>
              </View>
              <View style={{ paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: BorderRadius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderLight }}>
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                  {activeChallenges.length} active goal{activeChallenges.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            subtitle={card.subtitle}
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

          <RecentTransactions />

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
        </View>

        <View style={{ flex: 1, gap: Spacing.xl, minWidth: isWide ? 380 : '100%' as any }}>
          <BudgetHealth />
          <EmergencyWidget />

          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Active Challenge
              </Text>
              <TouchableOpacity onPress={() => router.push('/goals' as any)}>
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

          <AIInsights />

          <QuickNotes
            onViewAll={() => router.push('/notes' as any)}
            onNewNote={() => setShowNoteModal(true)}
          />

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
                  {categoryTotals[0]?.category || 'None yet'}
                </Text>
              </View>
            </View>
          </Card>
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
