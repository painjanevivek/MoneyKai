import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { WealthSnapshot } from '@/types/wealth';
import { formatCurrency } from '@/utils/formatCurrency';

interface PortfolioSummaryCardProps {
  snapshot: WealthSnapshot;
  currencySymbol: string;
}

export const PortfolioSummaryCard: React.FC<PortfolioSummaryCardProps> = ({ snapshot, currencySymbol }) => {
  const { colors } = useTheme();
  const pnlPositive = snapshot.totalPnl >= 0;

  return (
    <Card style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <MaterialCommunityIcons name="chart-timeline-variant" size={22} color={colors.primary} />
        <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          Wealth overview
        </Text>
      </View>
      <Text style={{ fontSize: Typography.fontSize['3xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }} numberOfLines={1}>
        {formatCurrency(snapshot.netWorth, currencySymbol)}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        <Metric label="Assets" value={formatCurrency(snapshot.totalAssets, currencySymbol)} />
        <Metric label="Invested" value={formatCurrency(snapshot.totalInvested, currencySymbol)} />
      </View>
      <Text style={{ fontSize: Typography.fontSize.sm, color: pnlPositive ? colors.success : colors.error }}>
        {pnlPositive ? '+' : ''}{formatCurrency(snapshot.totalPnl, currencySymbol)} total P/L
      </Text>
    </Card>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, minWidth: 140, gap: 2 }}>
      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{label}</Text>
      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};
