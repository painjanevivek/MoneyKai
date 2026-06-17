import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAiTransactionInsights } from '@/features/ai/hooks';
import type { AiInsightCard } from '@/features/ai/types';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { generateInsights } from '@/utils/insightEngine';
import { Card } from '../ui/Card';

interface AIInsightsProps {
  onOpenReports?: () => void;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ onOpenReports }) => {
  const { colors } = useTheme();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const totalIncome = useTransactionStore((s) => s.getTotalIncome());
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const settings = useBudgetStore((s) => s.settings);

  const fallbackInsights = generateInsights(settings.monthly_allowance, totalSpent, categoryTotals);
  const aiPayload =
    totalSpent > 0 || totalIncome > 0 || categoryTotals.length > 0
      ? {
          month: new Date().toISOString().slice(0, 7),
          currency: settings.currency || 'INR',
          totalSpent,
          totalIncome,
          categoryTotals: categoryTotals.slice(0, 8).map((item) => ({
            category: item.category,
            total: item.total,
            count: item.count,
            percentage: item.percentage,
          })),
          context: {
            surface: 'mobile_dashboard',
            monthlyAllowance: settings.monthly_allowance,
          },
        }
      : null;
  const { data, error, loading } = useAiTransactionInsights(aiPayload);

  const iconColors: Record<string, string> = {
    info: colors.primary,
    warning: colors.accent,
    success: colors.primaryLight,
    tip: colors.primary,
    achievement: colors.primaryLight,
    trend: colors.info,
  };
  const iconNames: Record<string, string> = {
    info: 'lightbulb-on-outline',
    warning: 'alert-circle-outline',
    success: 'check-decagram-outline',
    tip: 'lightbulb-on-outline',
    achievement: 'trophy-outline',
    trend: 'chart-line',
  };

  const localCards: AiInsightCard[] = fallbackInsights.slice(0, 3).map((insight) => ({
    id: insight.id,
    tone:
      insight.type === 'warning'
        ? ('warning' as const)
        : insight.type === 'achievement'
          ? ('success' as const)
          : ('info' as const),
    title: insight.actionLabel || 'Spending signal',
    body: insight.message,
    actionLabel: insight.actionLabel,
    metricLabel: null,
    metricValue: null,
  }));
  const cards = data?.cards?.length ? data.cards : error && localCards.length ? localCards : [];
  const sourceLabel =
    data?.source === 'deterministic'
      ? 'Showing deterministic spending signals from your current month data.'
      : error && localCards.length > 0
        ? 'Smart insights are unavailable right now. Showing local spending signals instead.'
        : null;

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text
          style={{
            fontSize: Typography.fontSize.md,
            fontFamily: Typography.fontFamily.semiBold,
            color: colors.textPrimary,
          }}
        >
          AI Insights
        </Text>
        {loading ? <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Analyzing...</Text> : null}
      </View>

      {cards.length > 0 ? (
        cards.slice(0, 3).map((card, index) => (
          <View
            key={card.id}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingVertical: Spacing.sm,
              borderTopWidth: index > 0 ? 1 : 0,
              borderTopColor: colors.borderLight,
              gap: Spacing.sm,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: `${iconColors[card.tone]}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              <MaterialCommunityIcons name={iconNames[card.tone]} size={16} color={iconColors[card.tone]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.xs,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textPrimary,
                  marginBottom: 2,
                }}
              >
                {card.title}
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontFamily: Typography.fontFamily.regular,
                  color: colors.textPrimary,
                  lineHeight: 20,
                }}
              >
                {card.body}
              </Text>
              {card.metricLabel && card.metricValue ? (
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: Typography.fontSize.xs,
                    color: colors.textSecondary,
                  }}
                >
                  {card.metricLabel}: {card.metricValue}
                </Text>
              ) : null}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textTertiary} />
          </View>
        ))
      ) : error ? (
        <View
          style={{
            paddingVertical: Spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textSecondary,
              lineHeight: 20,
            }}
          >
            {error}
          </Text>
        </View>
      ) : (
        <View
          style={{
            paddingVertical: Spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textSecondary,
              lineHeight: 20,
            }}
          >
            Add a few transactions and we&apos;ll surface personalized insights here.
          </Text>
        </View>
      )}

      {sourceLabel ? (
        <Text
          style={{
            marginTop: Spacing.sm,
            fontSize: Typography.fontSize.xs,
            color: colors.textSecondary,
            lineHeight: 18,
          }}
        >
          {sourceLabel}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={onOpenReports}
        disabled={!onOpenReports}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: Spacing.sm,
          gap: 4,
        }}
      >
        <Text
          style={{
            fontSize: Typography.fontSize.sm,
            fontFamily: Typography.fontFamily.medium,
            color: colors.primary,
          }}
        >
          View More Insights
        </Text>
        <MaterialCommunityIcons name="arrow-right" size={14} color={colors.primary} />
      </TouchableOpacity>
    </Card>
  );
};

export default AIInsights;
