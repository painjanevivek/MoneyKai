import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useReportingMonth } from '@/components/layout/ReportingMonthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useAiProviderStatus, useAiTransactionInsights } from '@/features/ai/hooks';
import type { AiInsightCard, AiTransactionInsightsRequest } from '@/features/ai/types';
import { useTheme } from '@/hooks/useTheme';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { isRenderableInsightCard } from '@/types/insight';
import { financePeriodProgress, monthFinancePeriod, previousFinancePeriod, summarizeTransactions } from '@/utils/financeCore';
import { generateDeterministicInsights } from '@/utils/insightEngine';

type AIInsightsProps = {
  showFooterLink?: boolean;
  surface?: 'dashboard' | 'reports';
};

const hasCjkText = (value?: string | null) => /[\u3400-\u9FFF\uF900-\uFAFF]/u.test(value ?? '');
const isEnglishFacingCard = (card: AiInsightCard) => ![card.title, card.body, card.caveat].some(hasCjkText);
const evidenceLabel = (value: string) => value.replace(/_/g, ' ');

export const AIInsights: React.FC<AIInsightsProps> = ({ showFooterLink = true, surface = 'reports' }) => {
  const { colors } = useTheme();
  const transactions = useTransactionStore((state) => state.transactions);
  const settings = useBudgetStore((state) => state.settings);
  const { selectedMonthDate } = useReportingMonth();
  const [expanded, setExpanded] = React.useState(false);

  const { period, current, previous, progress } = React.useMemo(() => {
    const selectedPeriod = monthFinancePeriod(selectedMonthDate);
    return {
      period: selectedPeriod,
      current: summarizeTransactions(transactions, { period: selectedPeriod }),
      previous: summarizeTransactions(transactions, { period: previousFinancePeriod(selectedPeriod) }),
      progress: financePeriodProgress(selectedPeriod),
    };
  }, [selectedMonthDate, transactions]);

  const deterministicCards = React.useMemo(() => generateDeterministicInsights({
    monthlyAllowance: settings.monthly_allowance,
    current,
    previous,
    period,
    progress,
  }), [current, period, previous, progress, settings.monthly_allowance]);

  const aiPayload = React.useMemo<AiTransactionInsightsRequest | null>(() => current.count > 0 ? ({
    month: period.startDate.slice(0, 7),
    currency: 'INR',
    totalSpent: current.expense,
    totalIncome: current.income,
    categoryTotals: current.categories.slice(0, 8),
    previousMonthSpent: previous.expense,
    previousMonthCategoryTotals: previous.categories.slice(0, 8),
    context: { surface },
  }) : null, [current, period.startDate, previous, surface]);

  const providerStatus = useAiProviderStatus(true);
  const ai = useAiTransactionInsights(aiPayload, false);
  const canEnhance = Boolean(aiPayload && providerStatus.data?.enabled && providerStatus.data.configured);
  const guardedAiCards = ai.data?.contractVersion === 'insight.v1' && ai.data.source === 'ai'
    ? ai.data.cards.filter((card) => isRenderableInsightCard(card) && isEnglishFacingCard(card))
    : [];
  const usingAi = guardedAiCards.length > 0;
  const cards = usingAi
    ? [...deterministicCards.slice(0, 3), ...guardedAiCards.slice(0, 2)]
    : deterministicCards;
  const visibleCards = expanded ? cards.slice(0, 5) : cards.slice(0, 3);

  const enhance = () => {
    if (!canEnhance) return;
    void ai.refresh().then(() => setExpanded(true)).catch(() => undefined);
  };

  const iconByTone: Record<AiInsightCard['tone'], keyof typeof MaterialCommunityIcons.glyphMap> = {
    info: 'lightbulb-on-outline',
    warning: 'alert-circle-outline',
    success: 'check-decagram-outline',
  };
  const colorByTone: Record<AiInsightCard['tone'], string> = {
    info: colors.primary,
    warning: colors.warning,
    success: colors.success,
  };

  return (
    <Card style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text accessibilityRole="header" style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Spending signals
          </Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
            {usingAi ? 'AI-assisted explanations over reviewed aggregate facts.' : 'Versioned deterministic rules over reviewed monthly facts.'}
          </Text>
        </View>
        {canEnhance ? (
          <Button title={usingAi ? 'Refresh AI' : 'Explain with AI'} variant="outline" size="sm" loading={ai.loading} onPress={enhance} />
        ) : (
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>LOCAL RULES</Text>
        )}
      </View>

      {ai.error ? (
        <Text accessibilityRole="alert" style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.warning }}>
          AI enhancement is unavailable. Deterministic signals remain active and no financial facts were changed.
        </Text>
      ) : null}

      {visibleCards.length > 0 ? visibleCards.map((card, index) => {
        const tone = colorByTone[card.tone];
        const evidence = [...new Set(card.provenance.map((item) => evidenceLabel(item.evidenceCode)))].join(', ');
        return (
          <View key={card.id} style={{ paddingTop: index > 0 ? Spacing.md : 0, borderTopWidth: index > 0 ? 1 : 0, borderTopColor: colors.borderLight, gap: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
              <View style={{ width: 32, height: 32, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: `${tone}14` }}>
                <MaterialCommunityIcons name={iconByTone[card.tone]} size={16} color={tone} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: tone }}>
                  {card.generatedBy === 'ai' ? 'AI EXPLANATION' : 'DETERMINISTIC RULE'}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{card.title}</Text>
                <Text style={{ marginTop: 3, fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>{card.body}</Text>
                {card.generatedBy === 'deterministic' && card.metricLabel && card.metricValue ? (
                  <Text style={{ marginTop: 5, fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: tone }}>
                    {card.metricLabel}: {card.metricValue}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={{ padding: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: colors.surface, gap: 3 }}>
              <Text style={{ fontSize: 11, lineHeight: 16, color: colors.textSecondary }}>Evidence: {evidence} · {card.provenance[0]?.period}</Text>
              <Text style={{ fontSize: 11, lineHeight: 16, color: colors.textTertiary }}>Caveat: {card.caveat}</Text>
            </View>
            {card.actions.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                {card.actions.map((action) => (
                  <Button key={`${card.id}:${action.href}`} title={action.label} variant="ghost" size="sm" onPress={() => router.push(action.href as any)} />
                ))}
              </View>
            ) : null}
          </View>
        );
      }) : (
        <View style={{ paddingVertical: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
            Add reviewed transactions in the selected month to activate evidence-backed signals.
          </Text>
        </View>
      )}

      {cards.length > 3 ? (
        <Button title={expanded ? 'Show fewer signals' : `Show ${Math.min(2, cards.length - 3)} more signals`} variant="ghost" size="sm" onPress={() => setExpanded((currentValue) => !currentValue)} />
      ) : null}

      {showFooterLink ? (
        <TouchableOpacity accessibilityRole="link" onPress={() => router.push('/reports' as any)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.primary }}>Open monthly reports</Text>
          <MaterialCommunityIcons name="arrow-right" size={14} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </Card>
  );
};

export default AIInsights;
