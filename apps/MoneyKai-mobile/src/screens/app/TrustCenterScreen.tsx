import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon as MaterialCommunityIcons } from '@/components/ui/AppIcon';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { CenteredPageHeader } from '@/components/ui/CenteredPageHeader';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useSyncStore } from '@/stores/useSyncStore';
import type { RootStackParamList } from '@/navigation/types';
import { getSplitOutstandingPaise } from '@/utils/groupExpense';
import { countUnconfirmedGroupRecords } from '@/utils/ledgerTrust';
import { createAppScreenStyles } from './screenStyles';

const TRUST_ITEMS = [
  {
    icon: 'calculator-variant-outline',
    title: 'Explainable balances',
    body: 'Open any group balance to see the original expense, payer, date, exact per-person shares, and which payments were recorded.',
  },
  {
    icon: 'shield-lock-outline',
    title: 'Only the access needed',
    body: 'Pasted-message parsing works without inbox permission. Optional automatic bank SMS access requires a separate disclosure and Android permission in supported distributions. Contacts are optional in the People picker; broad storage and microphone access are not required.',
  },
  {
    icon: 'archive-arrow-down-outline',
    title: 'Archive without losing history',
    body: 'Groups can be archived and restored. MoneyKai keeps permanent actions separate from everyday cleanup so a stray tap does not erase a ledger.',
  },
];

export function TrustCenterScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const groups = useGroupStore((state) => state.groups);
  const expenses = useGroupStore((state) => state.expenses);
  const syncStatus = useSyncStore((state) => state.status);
  const isOnline = useSyncStore((state) => state.isOnline);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const accountGroups = groups.filter((group) => group.created_by === (user?.id ?? 'local'));
  const groupIds = new Set(accountGroups.map((group) => group.id));
  const accountExpenses = expenses.filter((expense) => groupIds.has(expense.group_id));
  const unsettledShares = accountExpenses
    .filter((expense) => expense.sync_status !== 'pending' && expense.sync_status !== 'failed')
    .reduce((count, expense) => count + (expense.splits ?? []).filter((split) => getSplitOutstandingPaise(expense, split) > 0).length, 0);
  const groupRecordsAwaitingConfirmation = accountGroups.reduce((count, group) => {
    const status = countUnconfirmedGroupRecords(group, accountExpenses.filter((expense) => expense.group_id === group.id));
    return count + status.pending + status.failed;
  }, 0);
  const lastSyncDate = lastSyncedAt ? new Date(lastSyncedAt) : null;
  const lastSyncLabel = lastSyncDate && !Number.isNaN(lastSyncDate.getTime())
    ? lastSyncDate.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Not confirmed yet';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <CenteredPageHeader title="Trust & privacy" leftAction={<ScreenBackButton compact />} />
          <Text style={styles.subtitle}>Understand your balances, your data, and the current limits.</Text>
        </View>

        <View style={{ backgroundColor: colors.primary, borderRadius: BorderRadius.lg, marginBottom: Spacing.base, padding: Spacing.base }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.md }}>
            <MaterialCommunityIcons name="shield-check" color={colors.textInverse} size={24} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg }}>
                Your account at a glance
              </Text>
              <Text style={{ color: colors.textInverse, fontSize: Typography.fontSize.xs, lineHeight: 18, marginTop: 3, opacity: 0.82 }}>
                Signed in as {user?.email || 'a local user'} · {accountGroups.length} groups · {unsettledShares} open shares
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Review sync and backup status in Settings" onPress={() => navigation.navigate('Settings')} style={{ alignItems: 'flex-start', backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md, padding: Spacing.base }}>
          <View style={{ alignItems: 'center', backgroundColor: colors.primaryBg, borderRadius: BorderRadius.sm, height: 34, justifyContent: 'center', width: 34 }}>
            <MaterialCommunityIcons name={isOnline ? 'cloud-outline' : 'cloud-off-outline'} color={colors.primaryDark} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base }}>Sync & record status</Text>
            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20, marginTop: 4 }}>
              {isOnline ? syncStatus === 'syncing' ? 'Syncing now' : syncStatus === 'failed' ? 'Sync needs attention' : 'Online' : 'Offline'} · Last confirmed sync {lastSyncLabel}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 18, marginTop: 4 }}>
              Group records awaiting confirmation: {groupRecordsAwaitingConfirmation} · Sync queue: {pendingCount}
            </Text>
            <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs, marginTop: Spacing.sm, textDecorationLine: 'underline' }}>Review sync & backups</Text>
          </View>
        </TouchableOpacity>

        <View style={{ gap: Spacing.md }}>
          {(['privacy', 'terms'] as const).map((document) => <TouchableOpacity key={document} accessibilityRole="button" onPress={() => navigation.navigate('Legal', { document })} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base }}>{document === 'privacy' ? 'Privacy policy' : 'Terms & conditions'} →</Text></TouchableOpacity>)}
          {TRUST_ITEMS.map((item) => (
            <View key={item.title} style={{ alignItems: 'flex-start', backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, padding: Spacing.base }}>
              <View style={{ alignItems: 'center', backgroundColor: colors.primaryBg, borderRadius: BorderRadius.sm, height: 34, justifyContent: 'center', width: 34 }}>
                <MaterialCommunityIcons name={item.icon} color={colors.primaryDark} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base }}>
                  {item.title}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20, marginTop: 4 }}>
                  {item.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: colors.primaryBg, borderColor: colors.warning, borderRadius: BorderRadius.md, borderWidth: 1, marginTop: Spacing.base, padding: Spacing.base }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }}>
            <MaterialCommunityIcons name="information-outline" color={colors.warning} size={20} />
            <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base }}>
              Collaboration status
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20, marginTop: Spacing.sm }}>
            Group members are names in your own ledger. Invitations and shared editing across accounts are not available yet; these names are not verified accounts.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
