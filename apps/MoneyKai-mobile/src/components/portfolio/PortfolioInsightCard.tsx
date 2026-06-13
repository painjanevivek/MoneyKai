import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { WealthInsight } from '@/types/wealth';

interface PortfolioInsightCardProps {
  insights: WealthInsight[];
  aiInsights?: WealthInsight[];
  loadingAiInsights?: boolean;
  onGenerateAiInsights?: () => void;
}

export const PortfolioInsightCard: React.FC<PortfolioInsightCardProps> = ({
  insights,
  aiInsights = [],
  loadingAiInsights = false,
  onGenerateAiInsights,
}) => {
  const { colors } = useTheme();
  const combinedInsights = [...aiInsights, ...insights];

  return (
    <Card style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.primary} />
        <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          Portfolio insights
        </Text>
      </View>
      {onGenerateAiInsights ? (
        <Button
          title="Generate AI Insights"
          icon="brain"
          variant="outline"
          loading={loadingAiInsights}
          onPress={onGenerateAiInsights}
        />
      ) : null}
      {combinedInsights.length === 0 ? (
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          Insights will appear after holdings are available.
        </Text>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {combinedInsights.map((insight) => (
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
