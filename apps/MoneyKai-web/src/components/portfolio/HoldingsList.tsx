import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { PortfolioHolding } from '@/types/portfolio';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatPercent, getHoldingPnl, getHoldingPnlPercent } from '@/utils/portfolioMath';

interface HoldingsListProps {
  holdings: PortfolioHolding[];
  currencySymbol: string;
  title?: string;
  busyHoldingId?: string;
  onDelete?: (holding: PortfolioHolding) => void;
}

export const HoldingsList: React.FC<HoldingsListProps> = ({
  holdings,
  currencySymbol,
  title = 'Top holdings',
  busyHoldingId,
  onDelete,
}) => {
  const { colors } = useTheme();

  return (
    <Card style={{ gap: Spacing.md }}>
      <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
        {title}
      </Text>
      {holdings.length === 0 ? (
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          Holdings will appear after manual entry, statement import, or provider sync.
        </Text>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {holdings.map((holding) => {
            const pnl = getHoldingPnl(holding);
            return (
              <View key={holding.id} style={{ paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, minWidth: 170 }}>
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }} numberOfLines={1}>
                      {holding.name}
                    </Text>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }} numberOfLines={1}>
                      {holding.symbol ?? holding.assetType} | {holding.quantity.toLocaleString('en-IN')} units
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', minWidth: 136, flexGrow: 1 }}>
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }} numberOfLines={1}>
                      {formatCurrency(holding.currentValue, currencySymbol)}
                    </Text>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: pnl >= 0 ? colors.success : colors.error }} numberOfLines={1}>
                      {formatCurrency(pnl, currencySymbol)} ({formatPercent(getHoldingPnlPercent(holding))})
                    </Text>
                  </View>
                </View>
                {onDelete ? (
                  <Button
                    title="Remove"
                    icon="trash-can-outline"
                    size="sm"
                    variant="ghost"
                    loading={busyHoldingId === holding.id}
                    onPress={() => onDelete(holding)}
                    style={{ alignSelf: 'flex-start', marginTop: Spacing.xs }}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
};
