import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useLinkedAccountStore } from '@/stores/useLinkedAccountStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WorkspaceHeader } from '@/components/ui/WorkspaceHeader';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';

const ACCOUNT_KIND_OPTIONS: { id: LinkedAccountKind; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
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
  if (!value) return 'Never synced';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Never synced';

  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

const getStatusTone = (status: LinkedAccountStatus) => {
  if (status === 'connected' || status === 'syncing') return 'positive';
  if (status === 'needs_reauth' || status === 'paused') return 'warning';
  if (status === 'error') return 'danger';
  return 'default';
};

function StatusBadge({ status }: { status: LinkedAccountStatus }) {
  const { colors } = useTheme();
  const tone = getStatusTone(status);
  const color =
    tone === 'positive'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : tone === 'danger'
          ? colors.emergency
          : colors.textSecondary;
  const background =
    tone === 'positive'
      ? `${colors.success}16`
      : tone === 'warning'
        ? `${colors.warning}18`
        : tone === 'danger'
          ? colors.emergencyBg
          : colors.surface;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full, backgroundColor: background }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color }}>
        {getLinkedAccountStatusLabel(status)}
      </Text>
    </View>
  );
}

function MetricTile({ label, value, icon }: { label: string; value: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flex: 1, minWidth: 210 }}>
      <View style={{ width: 38, height: 38, borderRadius: BorderRadius.sm, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm }}>
        <MaterialCommunityIcons name={icon} size={19} color={colors.primary} />
      </View>
      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 3, fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
        {value}
      </Text>
    </Card>
  );
}

function AccountCard({
  account,
  selected,
  onSelect,
  onSync,
  onPause,
  onResume,
  onDisconnect,
}: {
  account: LinkedAccount;
  selected: boolean;
  onSelect: () => void;
  onSync: () => void;
  onPause: () => void;
  onResume: () => void;
  onDisconnect: () => void;
}) {
  const { colors } = useTheme();
  const isCredit = account.kind === 'credit_card' || account.kind === 'loan';
  const balanceLabel = isCredit ? 'Used balance' : 'Current balance';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onSelect}
      style={{
        flex: 1,
        minWidth: 300,
        padding: Spacing.base,
        borderRadius: BorderRadius.md,
        backgroundColor: selected ? colors.primaryBg : colors.card,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.borderLight,
        ...Shadows.sm,
        shadowColor: colors.shadowColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
        <View style={{ width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: selected ? colors.primary : colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: selected ? colors.primary : colors.border }}>
          <MaterialCommunityIcons name={isCredit ? 'credit-card-outline' : 'bank-outline'} size={22} color={selected ? colors.textInverse : colors.primary} />
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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md }}>
        <View style={{ flex: 1, minWidth: 130 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{balanceLabel}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 2, fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            {formatCurrency(account.balance.current)}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 130 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
            {isCredit ? 'Available credit' : 'Available'}
          </Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 2, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            {formatCurrency(account.balance.available)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, marginTop: Spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: BorderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
              {getLinkedAccountKindLabel(account.kind)}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: BorderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
              {getLinkedAccountProviderLabel(account.provider)}
            </Text>
          </View>
          <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: BorderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
              Synced {formatSyncTime(account.lastSyncedAt)}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
          <Button title="Sync" icon="sync" onPress={onSync} variant="outline" size="sm" />
          {account.status === 'paused' ? (
            <Button title="Resume" icon="play" onPress={onResume} variant="outline" size="sm" />
          ) : (
            <Button title="Pause" icon="pause" onPress={onPause} variant="ghost" size="sm" />
          )}
          <Button title="Disconnect" icon="link-off" onPress={onDisconnect} variant="ghost" size="sm" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function AccountsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { notificationsEnabled, hapticEnabled, currency, currencySymbol } = useSettingsStore();
  const accounts = useLinkedAccountStore((s) => s.accounts);
  const selectedAccountId = useLinkedAccountStore((s) => s.selectedAccountId);
  const connectSandboxAccounts = useLinkedAccountStore((s) => s.connectSandboxAccounts);
  const addManualAccount = useLinkedAccountStore((s) => s.addManualAccount);
  const syncAccount = useLinkedAccountStore((s) => s.syncAccount);
  const syncAllAccounts = useLinkedAccountStore((s) => s.syncAllAccounts);
  const pauseAccount = useLinkedAccountStore((s) => s.pauseAccount);
  const resumeAccount = useLinkedAccountStore((s) => s.resumeAccount);
  const disconnectAccount = useLinkedAccountStore((s) => s.disconnectAccount);
  const setSelectedAccountId = useLinkedAccountStore((s) => s.setSelectedAccountId);
  const transactions = useTransactionStore((s) => s.transactions);

  const [showManualModal, setShowManualModal] = useState(false);
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
  const selectedAccount = useMemo(
    () => activeAccounts.find((account) => account.id === selectedAccountId) ?? activeAccounts[0],
    [activeAccounts, selectedAccountId]
  );
  const selectedTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.captureAccountId === selectedAccount?.id),
    [selectedAccount?.id, transactions]
  );
  const selectedSpend = selectedTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const selectedIncome = selectedTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

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

    setShowManualModal(false);
    resetManualForm();
  };

  const handleDisconnect = (account: LinkedAccount) => {
    Alert.alert(
      'Disconnect account?',
      `Remove ${account.displayName} from MoneyKai? Imported transactions stay in your history with their account labels.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => disconnectAccount(account.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['4xl'] }}
      >
        <View style={{ gap: Spacing.xl, paddingHorizontal: Spacing.base, paddingTop: Spacing.md }}>
          <WorkspaceHeader
            icon="bank-outline"
            eyebrow="REAL ACCOUNTS LAYER"
            title="Linked accounts"
            description="Connect bank-ready account data, refresh balances, import transactions, and keep MoneyKai's dashboard grounded in account-level provenance."
            metrics={[
              { label: 'Connected', value: `${summary.connectedAccounts}/${summary.totalAccounts}` },
              { label: 'Cash available', value: formatCurrency(summary.cashBalance), tone: 'positive' },
              { label: 'Credit used', value: formatCurrency(summary.creditUsed), tone: summary.creditUsed > 0 ? 'warning' : 'default' },
              { label: 'Last sync', value: formatSyncTime(summary.lastSyncedAt) },
            ]}
            chips={[
              { icon: 'shield-check-outline', label: 'Consent-aware' },
              { icon: 'source-branch', label: 'Duplicate-safe import' },
              { icon: 'filter-variant', label: 'Account filters enabled' },
            ]}
            actions={
              <>
                <Button title="Connect Sandbox Bank" icon="bank-plus" onPress={handleConnectSandbox} variant="outline" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)' }} />
                <Button title="Add Manual Account" icon="plus" onPress={() => setShowManualModal(true)} variant="outline" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)' }} />
                <Button title="Sync All" icon="sync" onPress={syncAllAccounts} variant="outline" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)' }} />
              </>
            }
          />

          {activeAccounts.length === 0 ? (
            <Card style={{ borderColor: colors.primaryBg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View style={{ width: 56, height: 56, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="bank-outline" size={26} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    No linked bank accounts yet
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, marginTop: 4, lineHeight: 22 }}>
                    Start with sandbox accounts or add a manual balance. The dashboard and transaction ledger will use the same account layer immediately.
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'flex-end' }}>
                  <Button title="Connect Sandbox" icon="bank-plus" onPress={handleConnectSandbox} />
                  <Button title="Manual Account" icon="plus" onPress={() => setShowManualModal(true)} variant="outline" />
                </View>
              </View>
            </Card>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            <MetricTile label="Cash balance" value={formatCurrency(summary.cashBalance)} icon="cash-multiple" />
            <MetricTile label="Net linked balance" value={formatCurrency(summary.netLinkedBalance)} icon="scale-balance" />
            <MetricTile label="Available credit" value={formatCurrency(summary.availableCredit)} icon="credit-card-check-outline" />
            <MetricTile label="Needs attention" value={String(summary.attentionAccounts)} icon="alert-circle-outline" />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            {insights.map((insight) => {
              const color =
                insight.tone === 'positive'
                  ? colors.success
                  : insight.tone === 'warning'
                    ? colors.warning
                    : insight.tone === 'danger'
                      ? colors.emergency
                      : colors.primary;
              return (
                <Card key={insight.id} style={{ flex: 1, minWidth: 260 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
                    <View style={{ width: 34, height: 34, borderRadius: BorderRadius.sm, backgroundColor: `${color}16`, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name={insight.icon as any} size={18} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {insight.title}
                      </Text>
                      <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                        {insight.body}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xl, alignItems: 'flex-start' }}>
            <View style={{ flex: 2, minWidth: 320, gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
                <View>
                  <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                    Connected accounts
                  </Text>
                  <Text style={{ marginTop: 3, fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                    Balances, consent, import source, and account controls.
                  </Text>
                </View>
                <Button title="Transactions" icon="swap-horizontal" onPress={() => router.push('/transactions' as any)} variant="outline" />
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
                {activeAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    selected={selectedAccount?.id === account.id}
                    onSelect={() => setSelectedAccountId(account.id)}
                    onSync={() => syncAccount(account.id)}
                    onPause={() => pauseAccount(account.id)}
                    onResume={() => resumeAccount(account.id)}
                    onDisconnect={() => handleDisconnect(account)}
                  />
                ))}
              </View>
            </View>

            <View style={{ flex: 1, minWidth: 320, gap: Spacing.md }}>
              <Card>
                <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Account detail
                </Text>
                {selectedAccount ? (
                  <View style={{ marginTop: Spacing.md, gap: Spacing.md }}>
                    <View style={{ padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
                      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Selected account</Text>
                      <Text style={{ marginTop: 3, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                        {selectedAccount.displayName}
                      </Text>
                      <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                        {selectedAccount.institutionName} | {getLinkedAccountProviderLabel(selectedAccount.provider)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                      <View style={{ flex: 1, minWidth: 130, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg }}>
                        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Imported records</Text>
                        <Text style={{ marginTop: 2, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                          {selectedTransactions.length}
                        </Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 130, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
                        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Spend</Text>
                        <Text style={{ marginTop: 2, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                          {formatCurrency(selectedSpend)}
                        </Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 130, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
                        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Income</Text>
                        <Text style={{ marginTop: 2, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                          {formatCurrency(selectedIncome)}
                        </Text>
                      </View>
                    </View>
                    <View style={{ gap: Spacing.sm }}>
                      {[
                        ['Balance refresh', selectedAccount.features.balanceRefresh ? 'Enabled' : 'Manual'],
                        ['Transaction import', selectedAccount.features.transactionImport ? 'Enabled' : 'Manual only'],
                        ['Budget scope', selectedAccount.includeInBudget ? 'Included' : 'Excluded'],
                        ['Net worth scope', selectedAccount.includeInNetWorth ? 'Included' : 'Excluded'],
                        ['Consent expiry', selectedAccount.consentExpiresAt ? new Date(selectedAccount.consentExpiresAt).toLocaleDateString() : 'Not required'],
                      ].map(([label, value]) => (
                        <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
                          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>{label}</Text>
                          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22 }}>
                    Connect an account to see sync health, import totals, and consent details.
                  </Text>
                )}
              </Card>

              <Card>
                <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Account profile
                </Text>
                <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
                  {[
                    ['Profile', user?.full_name || 'Signed in user'],
                    ['Email', user?.email || 'No email available'],
                    ['Currency', `${currencySymbol} ${currency}`],
                    ['Notifications', notificationsEnabled ? 'Enabled' : 'Disabled'],
                    ['Haptics', hapticEnabled ? 'Enabled' : 'Disabled'],
                  ].map(([label, value]) => (
                    <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md }}>
                      <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>{label}</Text>
                      <Text style={{ flex: 1, textAlign: 'right', fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {value}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md }}>
                  <Button title="Edit profile" onPress={() => router.push('/profile-edit' as any)} variant="outline" />
                  <Button title="Settings" onPress={() => router.push('/settings' as any)} variant="outline" />
                </View>
              </Card>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showManualModal} transparent animationType="fade">
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: Spacing.xl }} onPress={() => setShowManualModal(false)}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 560,
              alignSelf: 'center',
              backgroundColor: colors.card,
              borderRadius: BorderRadius.xl,
              padding: Spacing.xl,
              borderWidth: 1,
              borderColor: colors.borderLight,
              ...Shadows.lg,
              shadowColor: colors.shadowColor,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, alignItems: 'flex-start', marginBottom: Spacing.lg }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                  Add manual account
                </Text>
                <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
                  Track a balance without a provider connection.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowManualModal(false)} accessibilityRole="button" accessibilityLabel="Close manual account modal">
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={true} style={{ maxHeight: 520 }}>
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
                          <MaterialCommunityIcons name={option.icon} size={16} color={active ? colors.primary : colors.textTertiary} />
                          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: active ? colors.primary : colors.textSecondary }}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
                  <View style={{ flex: 1, minWidth: 180 }}>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Current balance</Text>
                    <TextInput value={manualCurrent} onChangeText={setManualCurrent} placeholder="0" placeholderTextColor={colors.textTertiary} keyboardType="numeric" style={{ minHeight: 46, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: Spacing.md, color: colors.textPrimary }} />
                  </View>
                  <View style={{ flex: 1, minWidth: 180 }}>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Available balance</Text>
                    <TextInput value={manualAvailable} onChangeText={setManualAvailable} placeholder="Same as current" placeholderTextColor={colors.textTertiary} keyboardType="numeric" style={{ minHeight: 46, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: Spacing.md, color: colors.textPrimary }} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
                  <View style={{ flex: 1, minWidth: 180 }}>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Last 4 digits</Text>
                    <TextInput value={manualMask} onChangeText={setManualMask} placeholder="1234" placeholderTextColor={colors.textTertiary} maxLength={4} keyboardType="numeric" style={{ minHeight: 46, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: Spacing.md, color: colors.textPrimary }} />
                  </View>
                  <View style={{ flex: 1, minWidth: 180 }}>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Credit limit</Text>
                    <TextInput value={manualLimit} onChangeText={setManualLimit} placeholder="Optional" placeholderTextColor={colors.textTertiary} keyboardType="numeric" style={{ minHeight: 46, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: Spacing.md, color: colors.textPrimary }} />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg }}>
              <Button title="Cancel" onPress={() => setShowManualModal(false)} variant="outline" style={{ flex: 1 }} />
              <Button title="Save Account" icon="check" onPress={handleManualSubmit} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
