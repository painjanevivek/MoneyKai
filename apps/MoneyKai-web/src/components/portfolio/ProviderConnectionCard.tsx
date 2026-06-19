import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { PortfolioAccount } from '@/types/portfolio';

interface ProviderConnectionCardProps {
  accounts: PortfolioAccount[];
  busyAccountId?: string;
  onAddManual: () => void;
  onCreateManualAccount: () => void;
  onStartZerodha: () => void;
  onExploreAccountAggregator: () => void;
  onSync: (account: PortfolioAccount) => void;
  onPause: (account: PortfolioAccount) => void;
  onDisconnect: (account: PortfolioAccount) => void;
}

const providerLabels: Record<PortfolioAccount['provider'], string> = {
  zerodha: 'Zerodha',
  upstox: 'Upstox',
  angel_one: 'Angel One',
  account_aggregator: 'Account Aggregator',
  gmail_statement: 'Statement import',
  manual: 'Manual',
};

const statusLabels: Record<PortfolioAccount['status'], string> = {
  connected: 'Connected',
  needs_reauth: 'Setup required',
  paused: 'Paused',
  error: 'Needs review',
  disconnected: 'Disconnected',
};

export const ProviderConnectionCard: React.FC<ProviderConnectionCardProps> = ({
  accounts,
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
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const connectedCount = accounts.filter((account) => account.status === 'connected').length;
  const getStatusColor = (status: PortfolioAccount['status']) => {
    if (status === 'connected') {
      return colors.success;
    }
    if (status === 'needs_reauth' || status === 'paused') {
      return colors.warning;
    }
    if (status === 'error' || status === 'disconnected') {
      return colors.error;
    }
    return colors.textTertiary;
  };

  return (
    <Card style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm, minWidth: 0 }}>
        <MaterialCommunityIcons name="link-variant" size={20} color={colors.primary} />
        <Text style={{ flex: 1, minWidth: 180, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          Connected accounts
        </Text>
        {accounts.length > 0 ? (
          <View style={{ backgroundColor: colors.primaryBg, borderRadius: 999, paddingHorizontal: Spacing.sm, paddingVertical: 4 }}>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
              {connectedCount}/{accounts.length} active
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
        Add holdings manually today. Broker sync and Account Aggregator data stay setup-gated until live provider credentials and consent flows are configured.
      </Text>
      {accounts.length === 0 ? (
        <View style={{ gap: Spacing.sm }}>
          <Button title="Add Manual Entry" icon="plus" onPress={onAddManual} fullWidth />
          <Button title="Create Manual Account" icon="folder-plus-outline" onPress={onCreateManualAccount} variant="outline" fullWidth />
        </View>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {accounts.map((account) => (
            <View key={account.id} style={{ paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: Spacing.sm }}>
              <View style={{ flexDirection: isCompact ? 'column' : 'row', alignItems: isCompact ? 'stretch' : 'center', gap: Spacing.sm, minWidth: 0 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {account.displayName}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                    {providerLabels[account.provider]}
                    {account.maskedAccountId ? ` | ${account.maskedAccountId}` : ''}
                    {account.lastSyncedAt ? ` | ${new Date(account.lastSyncedAt).toLocaleDateString()}` : ''}
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 4,
                    backgroundColor: `${getStatusColor(account.status)}18`,
                  }}
                >
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: getStatusColor(account.status) }}>
                    {statusLabels[account.status]}
                  </Text>
                </View>
                {!isCompact ? <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} /> : null}
              </View>
              <View style={{ flexDirection: isCompact ? 'column' : 'row', flexWrap: isCompact ? 'nowrap' : 'wrap', gap: Spacing.sm, alignItems: isCompact ? 'stretch' : 'center' }}>
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
          <Button title="Add Manual Entry" icon="plus" onPress={onAddManual} variant="outline" fullWidth={isCompact} />
        </View>
      )}
      <View style={{ flexDirection: isCompact ? 'column' : 'row', flexWrap: isCompact ? 'nowrap' : 'wrap', gap: Spacing.sm, alignItems: isCompact ? 'stretch' : 'center' }}>
        <Button title="Broker setup" icon="chart-line" onPress={onStartZerodha} variant="outline" style={isCompact ? undefined : { flexGrow: 1, flexBasis: 220 }} />
        <Button title="AA setup" icon="bank-transfer" onPress={onExploreAccountAggregator} variant="outline" style={isCompact ? undefined : { flexGrow: 1, flexBasis: 220 }} />
      </View>
    </Card>
  );
};
