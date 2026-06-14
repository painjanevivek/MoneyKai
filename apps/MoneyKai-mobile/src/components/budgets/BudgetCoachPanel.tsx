import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAiBudgetCoach } from '@/features/ai/hooks';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Card } from '@/components/ui/Card';

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

  const { data, error, loading } = useAiBudgetCoach(
    {
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
        surface: 'mobile_savings',
      },
    },
    true,
  );

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
    <Card style={{ marginBottom: Spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md }}>
        <View style={{ flex: 1, paddingRight: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Budget Coach
          </Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
            Practical pacing guidance based on your current budget and category mix.
          </Text>
        </View>
        {loading ? <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Coaching...</Text> : null}
      </View>

      {data?.cards?.length ? (
        <View style={{ gap: Spacing.sm }}>
          {data.cards.slice(0, 3).map((card) => (
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
                  <MaterialCommunityIcons name={iconByTone[card.tone] as any} size={16} color={colorByTone[card.tone]} />
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
            {data.source === 'deterministic'
              ? 'Using deterministic coaching because model output was unavailable or not trustworthy.'
              : 'These suggestions are advisory and should still be reviewed against your real spending context.'}
          </Text>
        </View>
      ) : error ? (
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          {error}
        </Text>
      ) : (
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          Once your budget or spending data is available, MoneyKai will surface pacing suggestions here.
        </Text>
      )}
    </Card>
  );
};

export default BudgetCoachPanel;
