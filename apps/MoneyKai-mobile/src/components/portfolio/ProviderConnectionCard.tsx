import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { PortfolioAccount } from '@/types/portfolio';

interface ProviderConnectionCardProps {
  accounts: PortfolioAccount[];
  enabled: boolean;
  busyAccountId?: string;
  onAddManual: () => void;
  onCreateManualAccount: () => void;
  onStartZerodha: () => void;
  onExploreAccountAggregator: () => void;
  onSync: (account: PortfolioAccount) => void;
  onPause: (account: PortfolioAccount) => void;
  onDisconnect: (account: PortfolioAccount) => void;
}

export const ProviderConnectionCard: React.FC<ProviderConnectionCardProps> = ({
  accounts,
  enabled,
  busyAccountId,
  onAddManual,
  onCreateManualAccount,
  onStartZerodha,
  onExploreAccountAggregator,
  onSync,
  onPause,
  onDisconnect,
}) => {
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
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            Add manual wealth first, or start a provider connection when backend credentials are configured.
          </Text>
          <Button title="Add Manual Entry" icon="plus" onPress={onAddManual} />
          <Button title="Create Manual Account" icon="folder-plus-outline" onPress={onCreateManualAccount} variant="outline" />
        </View>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {accounts.map((account) => (
            <View key={account.id} style={{ paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {account.displayName}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                    {account.provider} | {account.status}
                    {account.lastSyncedAt ? ` | ${new Date(account.lastSyncedAt).toLocaleDateString()}` : ''}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                <Button
                  title="Sync"
                  icon="sync"
                  size="sm"
                  variant="outline"
                  loading={busyAccountId === account.id}
                  disabled={account.status === 'paused' || account.status === 'disconnected'}
                  onPress={() => onSync(account)}
                />
                <Button title="Pause" icon="pause" size="sm" variant="ghost" onPress={() => onPause(account)} />
                <Button title="Disconnect" icon="link-variant-off" size="sm" variant="ghost" onPress={() => onDisconnect(account)} />
              </View>
            </View>
          ))}
          <Button title="Add Manual Entry" icon="plus" onPress={onAddManual} variant="outline" />
        </View>
      )}
      {enabled ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          <Button title="Zerodha" icon="chart-line" onPress={onStartZerodha} variant="outline" style={{ flexGrow: 1 }} />
          <Button title="Account Aggregator" icon="bank-transfer" onPress={onExploreAccountAggregator} variant="outline" style={{ flexGrow: 1 }} />
        </View>
      ) : null}
    </Card>
  );
};
