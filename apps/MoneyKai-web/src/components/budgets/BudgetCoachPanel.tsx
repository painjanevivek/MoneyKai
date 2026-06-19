import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAiBudgetCoach, useAiProviderStatus } from '@/features/ai/hooks';
import type { AiBudgetCoachRequest, AiInsightCard } from '@/features/ai/types';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatCurrency';

const buildLocalBudgetCoachCards = ({
  monthlyAllowance,
  totalSpent,
  daysElapsed,
  daysRemaining,
  categoryTotals,
  emergencyMode,
}: AiBudgetCoachRequest): AiInsightCard[] => {
  if (monthlyAllowance <= 0) {
    return [
      {
        id: 'local-budget-start',
        tone: 'info',
        title: 'Set a monthly guardrail',
        body: 'Add a monthly budget first. MoneyKai can then compare actual spending against the pace you want for the month.',
        actionLabel: null,
        metricLabel: 'Budget',
        metricValue: 'Not set',
      },
      {
        id: 'local-first-records',
        tone: 'info',
        title: 'Add a few reviewed records',
        body: 'Budget coaching becomes useful after a few expenses are reviewed, categorized, and dated inside this month.',
        actionLabel: null,
        metricLabel: 'Tracked spend',
        metricValue: formatCurrency(totalSpent),
      },
    ];
  }

  const spendRatio = totalSpent / monthlyAllowance;
  const monthProgress = daysElapsed / Math.max(daysElapsed + daysRemaining, 1);
  const expectedSpend = monthlyAllowance * monthProgress;
  const paceDelta = totalSpent - expectedSpend;
  const topCategory = categoryTotals[0];
  const remaining = Math.max(0, monthlyAllowance - totalSpent);
  const dailyRoom = daysRemaining > 0 ? remaining / daysRemaining : remaining;
  const cards: AiInsightCard[] = [];

  if (emergencyMode) {
    cards.push({
      id: 'local-emergency-mode',
      tone: 'warning',
      title: 'Emergency mode is on',
      body: 'Prioritize essentials, pause optional spending, and review every new record before acting on the numbers.',
      actionLabel: null,
      metricLabel: 'Mode',
      metricValue: 'Conserve',
    });
  }

  cards.push({
    id: 'local-budget-pace',
    tone: spendRatio > monthProgress + 0.12 ? 'warning' : 'success',
    title: spendRatio > monthProgress + 0.12 ? 'Spending is ahead of pace' : 'Budget pace looks manageable',
    body: spendRatio > monthProgress + 0.12
      ? 'Slow optional purchases and review the largest category before adding new expenses this week.'
      : 'Keep reviewing expenses regularly so the monthly view stays calm and accurate.',
    actionLabel: null,
    metricLabel: paceDelta > 0 ? 'Ahead by' : 'Under pace by',
    metricValue: formatCurrency(Math.abs(paceDelta)),
  });

  cards.push({
    id: 'local-daily-room',
    tone: dailyRoom <= 0 ? 'warning' : 'info',
    title: daysRemaining > 0 ? 'Use a daily spending lane' : 'Month-end review time',
    body: daysRemaining > 0
      ? 'Use the remaining budget as a daily lane, not a target to fully spend.'
      : 'Review this month before the reset so next month starts with cleaner context.',
    actionLabel: null,
    metricLabel: 'Daily room',
    metricValue: formatCurrency(Math.max(0, dailyRoom)),
  });

  if (topCategory) {
    const topCategoryPercentage = topCategory.percentage ?? 0;
    cards.push({
      id: 'local-top-category',
      tone: topCategoryPercentage > 45 ? 'warning' : 'info',
      title: `Watch ${topCategory.category}`,
      body: topCategoryPercentage > 45
        ? 'This category is taking a large share of tracked spend. Check whether the latest records are correct and intentional.'
        : 'Your top category is visible now. Keep new records categorized so the coach can spot pressure early.',
      actionLabel: null,
      metricLabel: 'Share',
      metricValue: `${Math.round(topCategoryPercentage)}%`,
    });
  }

  return cards.slice(0, 3);
};

export const BudgetCoachPanel: React.FC = () => {
  const { colors } = useTheme();
  const { settings, isEmergencyMode } = useBudgetStore();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());

  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = Math.min(now.getDate(), daysInMonth);
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 0);
  const coachPayload = React.useMemo<AiBudgetCoachRequest>(() => ({
    month,
    currency: settings.currency || 'INR',
    monthlyAllowance: settings.monthly_allowance,
    totalSpent,
    daysElapsed,
    daysRemaining,
    categoryTotals: categoryTotals.slice(0, 8).map((item) => ({
      category: item.category,
      total: item.total,
      count: item.count,
      percentage: item.percentage,
    })),
    emergencyMode: isEmergencyMode,
    context: {
      surface: 'budgets',
    },
  }), [
    categoryTotals,
    daysElapsed,
    daysRemaining,
    isEmergencyMode,
    month,
    settings.currency,
    settings.monthly_allowance,
    totalSpent,
  ]);
  const providerStatus = useAiProviderStatus(true);
  const canUseAiCoach = Boolean(providerStatus.data?.enabled && providerStatus.data.configured);
  const { data, loading } = useAiBudgetCoach(coachPayload, canUseAiCoach);
  const localCards = React.useMemo(() => buildLocalBudgetCoachCards(coachPayload), [coachPayload]);
  const cards = data?.cards?.length ? data.cards.slice(0, 3) : localCards;
  const usingAiCoach = Boolean(data?.cards?.length && data.source === 'ai');

  const iconByTone: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    info: 'compass-outline',
    warning: 'alert-outline',
    success: 'check-circle-outline',
  };
  const colorByTone: Record<string, string> = {
    info: colors.primary,
    warning: colors.accent,
    success: colors.primaryLight,
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.md }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Budget Coach
          </Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
            Practical pacing guidance from your current budget and category mix.
          </Text>
        </View>
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
          {loading ? 'Coaching...' : usingAiCoach ? 'AI assisted' : 'Local guide'}
        </Text>
      </View>

      {cards.length ? (
        <View style={{ gap: Spacing.sm }}>
          {cards.map((card) => (
            <View
              key={card.id}
              style={{
                borderRadius: BorderRadius.md,
                borderWidth: 1,
                borderColor: colors.borderLight,
                backgroundColor: colors.surface,
                padding: Spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${colorByTone[card.tone]}15`,
                  }}
                >
                  <MaterialCommunityIcons name={iconByTone[card.tone]} size={16} color={colorByTone[card.tone]} />
                </View>
                <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {card.title}
                </Text>
              </View>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                {card.body}
              </Text>
              {card.metricLabel && card.metricValue ? (
                <Text style={{ marginTop: 8, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                  {card.metricLabel}: {card.metricValue}
                </Text>
              ) : null}
            </View>
          ))}
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
            {usingAiCoach
              ? 'These suggestions are advisory and should still be reviewed against your real spending context.'
              : 'Using local deterministic coaching. AI can enhance this when the backend provider is configured.'}
          </Text>
        </View>
      ) : (
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          Once your budget or spending data is available, MoneyKai will surface pacing suggestions here.
        </Text>
      )}
    </Card>
  );
};

export default BudgetCoachPanel;
