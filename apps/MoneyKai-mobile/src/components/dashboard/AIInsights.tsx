import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { generateInsights } from '../../utils/insightEngine';
import type { CategoryTotal } from '../../types/transaction';
import { Typography, Spacing } from '../../constants/theme';

interface AIInsightsProps {
  title?: string;
  totalSpent?: number;
  categoryTotals?: CategoryTotal[];
  monthlyAllowance?: number;
  onPress?: () => void;
}

export const AIInsights: React.FC<AIInsightsProps> = ({
  title = 'Budget Insight',
  totalSpent: totalSpentProp,
  categoryTotals: categoryTotalsProp,
  monthlyAllowance: monthlyAllowanceProp,
  onPress,
}) => {
  const { colors } = useTheme();
  const storeTotalSpent = useTransactionStore((s) => s.getTotalSpent());
  const storeCategoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const { settings } = useBudgetStore();
  const totalSpent = totalSpentProp ?? storeTotalSpent;
  const categoryTotals = categoryTotalsProp ?? storeCategoryTotals;
  const monthlyAllowance = monthlyAllowanceProp ?? settings.monthly_allowance;

  const insights = generateInsights(monthlyAllowance, totalSpent, categoryTotals);

  const iconColors: Record<string, string> = {
    tip: colors.primary,
    warning: colors.accent,
    achievement: colors.primaryLight,
    trend: colors.info,
  };

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
          {title}
        </Text>
      </View>

      {insights.length > 0 ? (
        insights.slice(0, 3).map((insight, index) => (
          <View
            key={insight.id}
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
                backgroundColor: `${iconColors[insight.type]}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              <MaterialCommunityIcons
                name={(insight.icon || 'lightbulb-on-outline') as any}
                size={16}
                color={iconColors[insight.type]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontFamily: Typography.fontFamily.regular,
                  color: colors.textPrimary,
                  lineHeight: 20,
                }}
              >
                {insight.message}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textTertiary} />
          </View>
        ))
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

      <TouchableOpacity
        onPress={onPress ?? (() => undefined)}
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
          View more insights
        </Text>
        <MaterialCommunityIcons name="arrow-right" size={14} color={colors.primary} />
      </TouchableOpacity>
    </Card>
  );
};

export default AIInsights;
