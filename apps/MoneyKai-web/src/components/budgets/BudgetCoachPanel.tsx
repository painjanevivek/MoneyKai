import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAiBudgetCoach, useAiProviderStatus } from '@/features/ai/hooks';
import type { AiBudgetCoachRequest, AiInsightCard } from '@/features/ai/types';
import type { InsightEvidenceCode } from '@/types/insight';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { isRenderableInsightCard } from '@/types/insight';

type LocalCardDraft = Omit<AiInsightCard, 'caveat' | 'provenance' | 'actions' | 'generatedBy'>;

const completeLocalCard = (
  card: LocalCardDraft,
  month: string,
  evidenceCodes: InsightEvidenceCode[],
): AiInsightCard => ({
  ...card,
  caveat: 'This deterministic guide uses reviewed aggregate inputs and is not personalized financial advice.',
  provenance: evidenceCodes.map((evidenceCode) => ({
    source: evidenceCode === 'monthly_allowance'
      ? 'budget_settings'
      : evidenceCode === 'period_progress'
        ? 'deterministic_rule'
        : 'reviewed_transactions',
    evidenceCode,
    period: month,
    ruleId: `${card.id}.v1`,
  })),
  actions: [],
  generatedBy: 'deterministic',
});

const buildLocalBudgetCoachCards = ({
  monthlyAllowance,
  totalSpent,
  daysElapsed,
  daysRemaining,
  categoryTotals,
  month,
}: AiBudgetCoachRequest): AiInsightCard[] => {
  if (monthlyAllowance <= 0) {
    return [
      completeLocalCard({
        id: 'local-budget-start',
        tone: 'info',
        title: 'Set a monthly guardrail',
        body: 'Add a monthly budget first. MoneyKai can then compare actual spending against the pace you want for the month.',
        actionLabel: null,
        metricLabel: 'Budget',
        metricValue: 'Not set',
      }, month, ['monthly_allowance']),
      completeLocalCard({
        id: 'local-first-records',
        tone: 'info',
        title: 'Add a few reviewed records',
        body: 'Budget coaching becomes useful after a few expenses are reviewed, categorized, and dated inside this month.',
        actionLabel: null,
        metricLabel: 'Tracked spend',
        metricValue: formatCurrency(totalSpent),
      }, month, ['total_spent']),
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

  cards.push(completeLocalCard({
    id: 'local-budget-pace',
    tone: spendRatio > monthProgress + 0.12 ? 'warning' : 'success',
    title: spendRatio > monthProgress + 0.12 ? 'Spending is ahead of pace' : 'Budget pace looks manageable',
    body: spendRatio > monthProgress + 0.12
      ? 'Slow optional purchases and review the largest category before adding new expenses this week.'
      : 'Keep reviewing expenses regularly so the monthly view stays calm and accurate.',
    actionLabel: null,
    metricLabel: paceDelta > 0 ? 'Ahead by' : 'Under pace by',
    metricValue: formatCurrency(Math.abs(paceDelta)),
  }, month, ['monthly_allowance', 'total_spent', 'period_progress']));

  cards.push(completeLocalCard({
    id: 'local-daily-room',
    tone: dailyRoom <= 0 ? 'warning' : 'info',
    title: daysRemaining > 0 ? 'Use a daily spending lane' : 'Month-end review time',
    body: daysRemaining > 0
      ? 'Use the remaining budget as a daily lane, not a target to fully spend.'
      : 'Review this month before the reset so next month starts with cleaner context.',
    actionLabel: null,
    metricLabel: 'Daily room',
    metricValue: formatCurrency(Math.max(0, dailyRoom)),
  }, month, ['monthly_allowance', 'total_spent', 'period_progress']));

  if (topCategory) {
    const topCategoryPercentage = topCategory.percentage ?? 0;
    cards.push(completeLocalCard({
      id: 'local-top-category',
      tone: topCategoryPercentage > 45 ? 'warning' : 'info',
      title: `Watch ${topCategory.category}`,
      body: topCategoryPercentage > 45
        ? 'This category is taking a large share of tracked spend. Check whether the latest records are correct and intentional.'
        : 'Your top category is visible now. Keep new records categorized so the coach can spot pressure early.',
      actionLabel: null,
      metricLabel: 'Share',
      metricValue: `${Math.round(topCategoryPercentage)}%`,
    }, month, ['category_totals']));
  }

  return cards.slice(0, 3);
};

export const BudgetCoachPanel: React.FC = () => {
  const { colors } = useTheme();
  const { settings } = useBudgetStore();
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
    context: {
      surface: 'budgets',
    },
  }), [
    categoryTotals,
    daysElapsed,
    daysRemaining,
    month,
    settings.currency,
    settings.monthly_allowance,
    totalSpent,
  ]);
  const providerStatus = useAiProviderStatus(true);
  const canUseAiCoach = Boolean(providerStatus.data?.enabled && providerStatus.data.configured);
  const ai = useAiBudgetCoach(coachPayload, false);
  const localCards = React.useMemo(() => buildLocalBudgetCoachCards(coachPayload), [coachPayload]);
  const aiCards = ai.data?.contractVersion === 'insight.v1' && ai.data.source === 'ai'
    ? ai.data.cards.filter(isRenderableInsightCard).slice(0, 3)
    : [];
  const cards = aiCards.length ? [...localCards.slice(0, 2), ...aiCards.slice(0, 1)] : localCards;
  const usingAiCoach = aiCards.length > 0;

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
        {canUseAiCoach ? (
          <Button title={usingAiCoach ? 'Refresh AI' : 'Explain with AI'} variant="outline" size="sm" loading={ai.loading} onPress={() => void ai.refresh().catch(() => undefined)} />
        ) : <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Local guide</Text>}
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
              <Text style={{ marginBottom: 5, fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: colorByTone[card.tone] }}>
                {card.generatedBy === 'ai' ? 'AI EXPLANATION' : 'DETERMINISTIC RULE'}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                {card.body}
              </Text>
              {card.metricLabel && card.metricValue ? (
                <Text style={{ marginTop: 8, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                  {card.metricLabel}: {card.metricValue}
                </Text>
              ) : null}
              <Text style={{ marginTop: 8, fontSize: 11, lineHeight: 16, color: colors.textTertiary }}>
                Caveat: {card.caveat}
              </Text>
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
