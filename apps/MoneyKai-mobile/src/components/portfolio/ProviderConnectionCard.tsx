import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { PortfolioAccount } from '@/types/portfolio';

interface ProviderConnectionCardProps {
  accounts: PortfolioAccount[];
  enabled: boolean;
}

export const ProviderConnectionCard: React.FC<ProviderConnectionCardProps> = ({ accounts, enabled }) => {
  const { colors } = useTheme();

  return (
    <Card style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <MaterialCommunityIcons name="link-variant" size={20} color={enabled ? colors.primary : colors.textTertiary} />
        <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          Connected accounts
        </Text>
      </View>
      {!enabled ? (
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          Wealth monitoring is disabled for this build.
        </Text>
      ) : accounts.length === 0 ? (
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          Provider metadata can be stored when a connection flow is added.
        </Text>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {accounts.map((account) => (
            <View key={account.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {account.displayName}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                  {account.provider} | {account.status}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
            </View>
          ))}
        </View>
      )}
    </Card>
  );
};
