import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { WealthInsight } from '@/types/wealth';

interface PortfolioInsightCardProps {
  insights: WealthInsight[];
}

export const PortfolioInsightCard: React.FC<PortfolioInsightCardProps> = ({ insights }) => {
  const { colors } = useTheme();

  return (
    <Card style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.primary} />
        <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          Portfolio insights
        </Text>
      </View>
      {insights.length === 0 ? (
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          Insights will appear after holdings are available.
        </Text>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {insights.map((insight) => (
            <View key={insight.id} style={{ gap: 2 }}>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {insight.title}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                {insight.body}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
};
