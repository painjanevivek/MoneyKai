import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { generateInsights } from '../../utils/insightEngine';
import { Typography, Spacing } from '../../constants/theme';

export const AIInsights: React.FC = () => {
  const { colors } = useTheme();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const { settings } = useBudgetStore();

  const insights = generateInsights(settings.monthly_allowance, totalSpent, categoryTotals);

  const iconColors: Record<string, string> = {
    tip: colors.primary,
    warning: colors.accent,
    achievement: colors.primaryLight,
    trend: colors.info,
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text style={{
          fontSize: Typography.fontSize.md,
          fontFamily: Typography.fontFamily.semiBold,
          color: colors.textPrimary,
        }}>AI Insights</Text>
      </View>
      {insights.slice(0, 3).map((insight, index) => (
        <View key={insight.id} style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingVertical: Spacing.sm,
          borderTopWidth: index > 0 ? 1 : 0,
          borderTopColor: colors.borderLight,
          gap: Spacing.sm,
        }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: `${iconColors[insight.type]}15`,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}>
            <MaterialCommunityIcons
              name={(insight.icon || 'lightbulb-on-outline') as any}
              size={16}
              color={iconColors[insight.type]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textPrimary,
              lineHeight: 20,
            }}>{insight.message}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textTertiary} />
        </View>
      ))}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/analytics')}
        style={{

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.sm,
        gap: 4,
      }}>
        <Text style={{
          fontSize: Typography.fontSize.sm,
          fontFamily: Typography.fontFamily.medium,
          color: colors.primary,
        }}>View More Insights</Text>
        <MaterialCommunityIcons name="arrow-right" size={14} color={colors.primary} />
      </TouchableOpacity>
    </Card>
  );
};

export default AIInsights;
