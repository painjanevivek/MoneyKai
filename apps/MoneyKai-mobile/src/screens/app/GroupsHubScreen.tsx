import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon as MaterialCommunityIcons } from '@/components/ui/AppIcon';
import { SharedExpenseFlowSheet } from '@/components/groups/SharedExpenseFlowSheet';
import { SharedGroupCreateSheet } from '@/components/groups/SharedGroupCreateSheet';
import { SharedGroupLedgerSheet } from '@/components/groups/SharedGroupLedgerSheet';
import { GroupSummaryCard } from '@/components/groups/GroupSummaryCard';
import { Button } from '@/components/ui/Button';
import { CenteredPageHeader } from '@/components/ui/CenteredPageHeader';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { ScreenState } from '@/components/ui/ScreenState';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { syncRemoteState } from '@/services/remoteSync';
import type { Group } from '@/types/group';
import { getSplitOutstandingPaise } from '@/utils/groupExpense';
import { createAppScreenStyles } from './screenStyles';

type GroupFilter = 'active' | 'archived';

export function GroupsHubScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const groups = useGroupStore((state) => state.groups);
  const expenses = useGroupStore((state) => state.expenses);
  const addGroup = useGroupStore((state) => state.addGroup);
  const addGroupExpense = useGroupStore((state) => state.addGroupExpense);
  const recordSettlement = useGroupStore((state) => state.recordSettlement);
  const reverseSettlement = useGroupStore((state) => state.reverseSettlement);
  const archiveGroup = useGroupStore((state) => state.archiveGroup);
  const restoreGroup = useGroupStore((state) => state.restoreGroup);
  const retryGroupSync = useGroupStore((state) => state.retryGroupSync);
  const retryExpenseSync = useGroupStore((state) => state.retryExpenseSync);
  const syncStatus = useSyncStore((state) => state.status);
  const syncError = useSyncStore((state) => state.error);
  const isOnline = useSyncStore((state) => state.isOnline);
  const cachedAt = useSyncStore((state) => state.lastCacheHydratedAt);
  const [filter, setFilter] = useState<GroupFilter>('active');
  const [createVisible, setCreateVisible] = useState(false);
  const [expenseGroupId, setExpenseGroupId] = useState<string>();
  const [ledgerGroupId, setLedgerGroupId] = useState<string>();

  const currentUser = {
    id: user?.id ?? 'local',
    name: user?.full_name?.trim() || user?.email?.split('@')[0] || 'You',
  };
  const accountGroups = useMemo(() => groups.filter((group) => group.created_by === currentUser.id), [groups, currentUser.id]);
  const accountGroupIds = useMemo(() => new Set(accountGroups.map((group) => group.id)), [accountGroups]);
  const visibleGroups = useMemo(
    () => accountGroups.filter((group) => filter === 'archived' ? group.archived : !group.archived),
    [filter, accountGroups]
  );
  const expensesByGroup = useMemo(() => {
    const grouped = new Map<string, typeof expenses>();
    expenses.filter((expense) => accountGroupIds.has(expense.group_id)).forEach((expense) => grouped.set(expense.group_id, [...(grouped.get(expense.group_id) ?? []), expense]));
    return grouped;
  }, [accountGroupIds, expenses]);
  const activeGroups = accountGroups.filter((group) => !group.archived).length;
  const openShares = expenses.filter((expense) => accountGroupIds.has(expense.group_id) && expense.sync_status !== 'pending' && expense.sync_status !== 'failed').reduce((count, expense) => count + (expense.splits ?? []).filter((split) => getSplitOutstandingPaise(expense, split) > 0).length, 0);
  const expenseGroup = accountGroups.find((group) => group.id === expenseGroupId);
  const ledgerGroup = accountGroups.find((group) => group.id === ledgerGroupId);

  const handleArchive = (group: Group) => {
    const action = group.archived ? restoreGroup : archiveGroup;
    void action(group.id).catch((error) => Alert.alert('Group update not confirmed', error instanceof Error ? error.message : 'Retry this action from the group list.'));
    setLedgerGroupId(undefined);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <CenteredPageHeader title="Groups" actionWidth={80} leftAction={<Button title="New" size="sm" icon="plus" iconPosition="left" onPress={() => setCreateVisible(true)} />} rightAction={<ScreenBackButton compact />} />
        <Text style={[styles.subtitle, { marginBottom: Spacing.base, marginTop: 0 }]}>A clear ledger for trips, homes, friends, and events.</Text>

        <View style={{ backgroundColor: colors.primary, borderColor: colors.primaryDark, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.base, overflow: 'hidden', padding: Spacing.base }}>
          <MaterialCommunityIcons name="scale-balance" color="rgba(23, 26, 21, 0.08)" size={132} style={{ position: 'absolute', right: -16, top: 18 }} />
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.md }}>
            <View style={{ alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: BorderRadius.sm, height: 44, justifyContent: 'center', width: 44 }}>
              <MaterialCommunityIcons name="scale-balance" color={colors.textInverse} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base }}>
                The math stays visible
              </Text>
              <Text style={{ color: colors.textInverse, fontSize: Typography.fontSize.xs, lineHeight: 18, marginTop: 3, opacity: 0.76 }}>
                Every balance opens into the payer, date, exact shares, and payment status—so nobody has to trust a mystery total.
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
            <View style={{ backgroundColor: 'rgba(23,26,21,0.08)', borderColor: 'rgba(23,26,21,0.16)', borderRadius: BorderRadius.sm, borderWidth: 1, flex: 1, padding: Spacing.sm }}>
              <Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg }}>{activeGroups}</Text>
              <Text style={{ color: colors.textInverse, fontSize: Typography.fontSize.xs, opacity: 0.7 }}>Active groups</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(23,26,21,0.08)', borderColor: 'rgba(23,26,21,0.16)', borderRadius: BorderRadius.sm, borderWidth: 1, flex: 1, padding: Spacing.sm }}>
              <Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg }}>{openShares}</Text>
              <Text style={{ color: colors.textInverse, fontSize: Typography.fontSize.xs, opacity: 0.7 }}>Open shares</Text>
            </View>
          </View>
        </View>

        <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base }}>
          {(['active', 'archived'] as const).map((item) => {
            const selected = filter === item;
            return (
              <TouchableOpacity
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setFilter(item)}
                style={{ backgroundColor: selected ? colors.primaryBg : 'transparent', borderColor: selected ? colors.primary : colors.borderLight, borderRadius: BorderRadius.sm, borderWidth: 1, justifyContent: 'center', minHeight: 38, paddingHorizontal: Spacing.md }}
              >
                <Text style={{ color: selected ? colors.primary : colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, textTransform: 'capitalize' }}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ gap: Spacing.md }}>
          {visibleGroups.map((group) => (
            <View key={group.id}>
              <GroupSummaryCard
                group={group}
                expenses={expensesByGroup.get(group.id) ?? []}
                currentUserId={currentUser.id}
                currencySymbol={currencySymbol}
                onAddExpense={() => setExpenseGroupId(group.id)}
                onOpenLedger={() => setLedgerGroupId(group.id)}
              />
              {group.sync_status && group.sync_status !== 'confirmed' ? (
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                  <Text style={{ color: colors.textSecondary, flex: 1, fontSize: Typography.fontSize.xs }}>{group.sync_error ? 'Group confirmation unknown' : 'Group awaiting synchronization'}</Text>
                  <Button title="Retry sync" size="sm" variant="outline" onPress={() => void retryGroupSync(group.id).catch((error) => Alert.alert('Still awaiting confirmation', error instanceof Error ? error.message : 'Try again when connected.'))} />
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {visibleGroups.length === 0 && syncStatus === 'syncing' && !cachedAt ? (
          <ScreenState loading title="Loading groups" body="Getting your confirmed shared ledgers." style={{ marginTop: Spacing.lg }} />
        ) : visibleGroups.length === 0 && syncStatus === 'failed' && !cachedAt ? (
          <ScreenState icon="cloud-alert-outline" title={isOnline ? 'Groups could not load' : 'You are offline'} body={syncError || 'No cached groups are available on this device.'} actionLabel="Retry" onAction={() => void syncRemoteState({ force: true, keepLocalData: true })} style={{ marginTop: Spacing.lg }} />
        ) : visibleGroups.length === 0 ? (
          <ScreenState
            icon={filter === 'active' ? 'account-group-outline' : 'archive-outline'}
            title={filter === 'active' ? 'No shared groups yet' : 'No archived groups'}
            body={filter === 'active' ? 'Create one with just a name and the people involved. Add the first expense when it happens.' : 'Groups you archive will stay available here.'}
            actionLabel={filter === 'active' ? 'Create a group' : undefined}
            onAction={filter === 'active' ? () => setCreateVisible(true) : undefined}
            style={{ marginTop: Spacing.lg }}
          />
        ) : null}
      </ScrollView>

      <SharedGroupCreateSheet visible={createVisible} currentUser={currentUser} onClose={() => setCreateVisible(false)} onCreate={addGroup} />
      <SharedExpenseFlowSheet
        visible={Boolean(expenseGroup)}
        group={expenseGroup}
        currentUser={currentUser}
        currencySymbol={currencySymbol}
        onClose={() => setExpenseGroupId(undefined)}
        onAdd={addGroupExpense}
        onAddPeople={useGroupStore.getState().addPeopleToGroup}
      />
      <SharedGroupLedgerSheet
        visible={Boolean(ledgerGroup)}
        group={ledgerGroup}
        expenses={ledgerGroup ? (expensesByGroup.get(ledgerGroup.id) ?? []) : []}
        currencySymbol={currencySymbol}
        currentUser={currentUser}
        onClose={() => setLedgerGroupId(undefined)}
        onAddExpense={() => {
          if (!ledgerGroup) return;
          setExpenseGroupId(ledgerGroup.id);
          setLedgerGroupId(undefined);
        }}
        onRecordSettlement={recordSettlement}
        onReverseSettlement={reverseSettlement}
        onRetryExpense={retryExpenseSync}
        onArchive={() => ledgerGroup && handleArchive(ledgerGroup)}
      />
    </SafeAreaView>
  );
}
