import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  formatLinkedAccountMask,
  getLinkedAccountInsights,
  getLinkedAccountKindLabel,
  getLinkedAccountProviderLabel,
  getLinkedAccountStatusLabel,
  summarizeLinkedAccounts,
  type LinkedAccount,
  type LinkedAccountKind,
  type LinkedAccountStatus,
} from '@moneykai/domain';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLinkedAccountStore } from '@/stores/useLinkedAccountStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';

const ACCOUNT_KIND_OPTIONS: { id: LinkedAccountKind; label: string; icon: string }[] = [
  { id: 'checking', label: 'Checking', icon: 'bank-outline' },
  { id: 'savings', label: 'Savings', icon: 'safe-square-outline' },
  { id: 'credit_card', label: 'Credit card', icon: 'credit-card-outline' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet-outline' },
  { id: 'cash', label: 'Cash', icon: 'cash' },
  { id: 'loan', label: 'Loan', icon: 'file-document-outline' },
];

const parseMoneyInput = (value: string) => {
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : NaN;
};

const formatSyncTime = (value?: string) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Never';
  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

const getStatusColor = (status: LinkedAccountStatus, colors: ReturnType<typeof useTheme>['colors']) => {
  if (status === 'connected' || status === 'syncing') return colors.success;
  if (status === 'needs_reauth' || status === 'paused') return colors.warning;
  if (status === 'error') return colors.emergency;
  return colors.textSecondary;
};

function StatusBadge({ status }: { status: LinkedAccountStatus }) {
  const { colors } = useTheme();
  const color = getStatusColor(status, colors);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: BorderRadius.full, backgroundColor: `${color}14` }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color }}>
        {getLinkedAccountStatusLabel(status)}
      </Text>
    </View>
  );
}

function AccountCard({
  account,
  onSync,
  onPause,
  onResume,
  onDisconnect,
}: {
  account: LinkedAccount;
  onSync: () => void;
  onPause: () => void;
  onResume: () => void;
  onDisconnect: () => void;
}) {
  const { colors } = useTheme();
  const isCredit = account.kind === 'credit_card' || account.kind === 'loan';

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
        <View style={{ width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name={isCredit ? 'credit-card-outline' : 'bank-outline'} size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            {account.displayName}
          </Text>
          <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
            {account.institutionName} | {formatLinkedAccountMask(account)}
          </Text>
        </View>
        <StatusBadge status={account.status} />
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
        <View style={{ flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{isCredit ? 'Used' : 'Current'}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 2, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            {formatCurrency(account.balance.current)}
          </Text>
        </View>
        <View style={{ flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{isCredit ? 'Available credit' : 'Available'}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 2, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            {formatCurrency(account.balance.available)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: Spacing.md }}>
        {[getLinkedAccountKindLabel(account.kind), getLinkedAccountProviderLabel(account.provider), `Synced ${formatSyncTime(account.lastSyncedAt)}`].map((label) => (
          <View key={label} style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: BorderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md }}>
        <Button title="Sync" icon="sync" onPress={onSync} variant="outline" size="sm" style={{ flexGrow: 1 }} />
        {account.status === 'paused' ? (
          <Button title="Resume" icon="play" onPress={onResume} variant="outline" size="sm" style={{ flexGrow: 1 }} />
        ) : (
          <Button title="Pause" icon="pause" onPress={onPause} variant="ghost" size="sm" style={{ flexGrow: 1 }} />
        )}
        <Button title="Disconnect" icon="link-off" onPress={onDisconnect} variant="ghost" size="sm" style={{ flexGrow: 1 }} />
      </View>
    </Card>
  );
}

export default function AccountsScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const currency = useSettingsStore((s) => s.currency);
  const accounts = useLinkedAccountStore((s) => s.accounts);
  const connectSandboxAccounts = useLinkedAccountStore((s) => s.connectSandboxAccounts);
  const addManualAccount = useLinkedAccountStore((s) => s.addManualAccount);
  const syncAccount = useLinkedAccountStore((s) => s.syncAccount);
  const syncAllAccounts = useLinkedAccountStore((s) => s.syncAllAccounts);
  const pauseAccount = useLinkedAccountStore((s) => s.pauseAccount);
  const resumeAccount = useLinkedAccountStore((s) => s.resumeAccount);
  const disconnectAccount = useLinkedAccountStore((s) => s.disconnectAccount);
  const transactions = useTransactionStore((s) => s.transactions);

  const [showManualSheet, setShowManualSheet] = useState(false);
  const [manualInstitution, setManualInstitution] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualKind, setManualKind] = useState<LinkedAccountKind>('checking');
  const [manualMask, setManualMask] = useState('');
  const [manualCurrent, setManualCurrent] = useState('');
  const [manualAvailable, setManualAvailable] = useState('');
  const [manualLimit, setManualLimit] = useState('');

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.status !== 'disconnected'),
    [accounts]
  );
  const summary = useMemo(() => summarizeLinkedAccounts(accounts), [accounts]);
  const insights = useMemo(() => getLinkedAccountInsights(accounts), [accounts]);
  const importedCount = useMemo(
    () => transactions.filter((transaction) => transaction.captureAccountId).length,
    [transactions]
  );

  const resetManualForm = () => {
    setManualInstitution('');
    setManualName('');
    setManualKind('checking');
    setManualMask('');
    setManualCurrent('');
    setManualAvailable('');
    setManualLimit('');
  };

  const handleConnectSandbox = () => {
    connectSandboxAccounts(user?.id ?? 'local');
  };

  const handleManualSubmit = () => {
    const currentBalance = parseMoneyInput(manualCurrent);
    const availableBalance = manualAvailable.trim() ? parseMoneyInput(manualAvailable) : currentBalance;
    const limit = manualLimit.trim() ? parseMoneyInput(manualLimit) : undefined;

    if (!manualInstitution.trim() || !manualName.trim() || !Number.isFinite(currentBalance) || !Number.isFinite(availableBalance)) {
      Alert.alert('Missing account details', 'Add a name, institution, and valid balance before saving this account.');
      return;
    }

    addManualAccount({
      institutionName: manualInstitution,
      displayName: manualName,
      kind: manualKind,
      maskedAccountNumber: manualMask,
      currentBalance,
      availableBalance,
      limit: Number.isFinite(limit) ? limit : undefined,
      currency,
    }, user?.id ?? 'local');

    setShowManualSheet(false);
    resetManualForm();
  };

  const handleDisconnect = (account: LinkedAccount) => {
    Alert.alert(
      'Disconnect account?',
      `Remove ${account.displayName} from MoneyKai? Imported transactions stay in your history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => disconnectAccount(account.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing['2xl'], gap: Spacing.base }} showsVerticalScrollIndicator={false}>
        <AppScreenHeader
          icon="bank-outline"
          eyebrow="REAL ACCOUNTS"
          title="Linked accounts"
          description="Balances, consent state, and account-tagged imports for MoneyKai."
          metrics={[
            { label: 'Connected', value: `${summary.connectedAccounts}/${summary.totalAccounts}` },
            { label: 'Cash', value: formatCurrency(summary.cashBalance), tone: 'positive' },
            { label: 'Imported', value: String(importedCount) },
          ]}
          chips={[
            { icon: 'shield-check-outline', label: 'Consent-aware' },
            { icon: 'filter-variant', label: 'Transaction filters' },
          ]}
          actions={
            <>
              <Button title="Connect Sandbox" icon="bank-plus" onPress={handleConnectSandbox} variant="outline" />
              <Button title="Manual" icon="plus" onPress={() => setShowManualSheet(true)} variant="outline" />
              <Button title="Sync" icon="sync" onPress={syncAllAccounts} variant="outline" />
            </>
          }
        />

        {activeAccounts.length === 0 ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View style={{ width: 50, height: 50, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="bank-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  No linked bank accounts yet
                </Text>
                <Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                  Connect sandbox accounts or add a manual balance to activate account-level views.
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <View style={{ flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Net linked</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 2, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
              {formatCurrency(summary.netLinkedBalance)}
            </Text>
          </View>
          <View style={{ flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderLight }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Credit used</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 2, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
              {formatCurrency(summary.creditUsed)}
            </Text>
          </View>
        </View>

        {insights.map((insight) => {
          const color = insight.tone === 'positive' ? colors.success : insight.tone === 'warning' ? colors.warning : insight.tone === 'danger' ? colors.emergency : colors.primary;
          return (
            <Card key={insight.id}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                <MaterialCommunityIcons name={insight.icon as any} size={20} color={color} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {insight.title}
                  </Text>
                  <Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                    {insight.body}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}

        {activeAccounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onSync={() => syncAccount(account.id)}
            onPause={() => pauseAccount(account.id)}
            onResume={() => resumeAccount(account.id)}
            onDisconnect={() => handleDisconnect(account)}
          />
        ))}
      </ScrollView>

      <ModalSheet
        visible={showManualSheet}
        title="Add manual account"
        subtitle="Track a balance without a provider connection."
        onClose={() => setShowManualSheet(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <Button title="Cancel" onPress={() => setShowManualSheet(false)} variant="outline" style={{ flex: 1 }} />
            <Button title="Save" icon="check" onPress={handleManualSubmit} style={{ flex: 1 }} />
          </View>
        }
      >
        <View style={{ gap: Spacing.md }}>
          <View>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Institution</Text>
            <TextInput value={manualInstitution} onChangeText={setManualInstitution} placeholder="Example Bank" placeholderTextColor={colors.textTertiary} style={{ minHeight: 46, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: Spacing.md, color: colors.textPrimary }} />
          </View>
          <View>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Display name</Text>
            <TextInput value={manualName} onChangeText={setManualName} placeholder="Everyday Checking" placeholderTextColor={colors.textTertiary} style={{ minHeight: 46, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: Spacing.md, color: colors.textPrimary }} />
          </View>
          <View>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Account type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {ACCOUNT_KIND_OPTIONS.map((option) => {
                const active = manualKind === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => setManualKind(option.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      borderRadius: BorderRadius.full,
                      backgroundColor: active ? colors.primaryBg : colors.surface,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.border,
                    }}
                  >
                    <MaterialCommunityIcons name={option.icon as any} size={16} color={active ? colors.primary : colors.textTertiary} />
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: active ? colors.primary : colors.textSecondary }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Current</Text>
              <TextInput value={manualCurrent} onChangeText={setManualCurrent} placeholder="0" placeholderTextColor={colors.textTertiary} keyboardType="numeric" style={{ minHeight: 46, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: Spacing.md, color: colors.textPrimary }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Available</Text>
              <TextInput value={manualAvailable} onChangeText={setManualAvailable} placeholder="Same" placeholderTextColor={colors.textTertiary} keyboardType="numeric" style={{ minHeight: 46, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: Spacing.md, color: colors.textPrimary }} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Last 4</Text>
              <TextInput value={manualMask} onChangeText={setManualMask} placeholder="1234" placeholderTextColor={colors.textTertiary} keyboardType="numeric" maxLength={4} style={{ minHeight: 46, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: Spacing.md, color: colors.textPrimary }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Limit</Text>
              <TextInput value={manualLimit} onChangeText={setManualLimit} placeholder="Optional" placeholderTextColor={colors.textTertiary} keyboardType="numeric" style={{ minHeight: 46, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: Spacing.md, color: colors.textPrimary }} />
            </View>
          </View>
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}
