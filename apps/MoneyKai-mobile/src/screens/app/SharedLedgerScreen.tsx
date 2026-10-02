import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SharedExpenseFlowSheet } from '@/components/groups/SharedExpenseFlowSheet';
import { SharedGroupCreateSheet } from '@/components/groups/SharedGroupCreateSheet';
import { SharedGroupLedgerSheet } from '@/components/groups/SharedGroupLedgerSheet';
import { GroupSummaryCard } from '@/components/groups/GroupSummaryCard';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { PressableScale } from '@/components/ui/PressableScale';
import { AppIcon } from '@/components/ui/AppIcon';
import { ScreenState } from '@/components/ui/ScreenState';
import { BorderRadius, Spacing, TransactionDirectionColorOnDark, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { AppTabParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useHomeModeStore } from '@/stores/useHomeModeStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { isDemoModeEnabled } from '@/config/environment';
import { syncRemoteState } from '@/services/remoteSync';
import type { Group, GroupExpense } from '@/types/group';
import { deriveSharedPosition, formatPaise, getExpensePaise } from '@/utils/groupExpense';
import { countUnconfirmedGroupRecords } from '@/utils/ledgerTrust';
import { resolveGroupsLandingState } from '@/utils/groupsLandingState';
import { createAppScreenStyles } from './screenStyles';
import { getFloatingDockLayout } from '@/utils/floatingDockLayout';

type GroupsNavigation = BottomTabNavigationProp<AppTabParamList, 'Groups'>;

export function SharedLedgerScreen() {
  const navigation = useNavigation<GroupsNavigation>();
  const route = useRoute<RouteProp<AppTabParamList, 'Groups'>>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const basicMode = useHomeModeStore((state) => state.mode === 'basic');
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { contentPaddingBottom } = getFloatingDockLayout(fontScale, insets.bottom, basicMode);
  const transactions = useTransactionStore((state) => state.transactions);
  const groups = useGroupStore((state) => state.groups);
  const expenses = useGroupStore((state) => state.expenses);
  const addGroup = useGroupStore((state) => state.addGroup);
  const addGroupExpense = useGroupStore((state) => state.addGroupExpense);
  const addPeopleToGroup = useGroupStore((state) => state.addPeopleToGroup);
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
  const [actionVisible, setActionVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [createForSplit, setCreateForSplit] = useState(false);
  const [groupPickerVisible, setGroupPickerVisible] = useState(false);
  const [transactionPickerVisible, setTransactionPickerVisible] = useState(false);
  const [splitTransactionId, setSplitTransactionId] = useState<string>();
  const [expenseGroupId, setExpenseGroupId] = useState<string>();
  const [ledgerGroupId, setLedgerGroupId] = useState<string>();

  const currentUser = {
    id: user?.id ?? 'local',
    name: user?.full_name?.trim() || user?.email?.split('@')[0] || 'You',
  };
  const accountGroups = useMemo(() => groups.filter((group) => group.created_by === currentUser.id), [groups, currentUser.id]);
  const accountGroupIds = useMemo(() => new Set(accountGroups.map((group) => group.id)), [accountGroups]);
  const accountExpenses = useMemo(() => expenses.filter((expense) => accountGroupIds.has(expense.group_id)), [expenses, accountGroupIds]);
  const expensesByGroup = useMemo(() => {
    const result = new Map<string, GroupExpense[]>();
    for (const expense of accountExpenses) {
      const list = result.get(expense.group_id) ?? [];
      list.push(expense);
      result.set(expense.group_id, list);
    }
    return result;
  }, [accountExpenses]);
  const position = useMemo(() => deriveSharedPosition(accountExpenses, currentUser.id), [accountExpenses, currentUser.id]);
  const grouped = useMemo(() => {
    const active: Group[] = [];
    const settled: Group[] = [];
    const archived: Group[] = [];
    for (const group of accountGroups) {
      if (group.archived) archived.push(group);
      else if (deriveSharedPosition(expensesByGroup.get(group.id) ?? [], currentUser.id).openShares > 0) active.push(group);
      else settled.push(group);
    }
    const latestActivity = (group: Group) => (expensesByGroup.get(group.id) ?? []).reduce((latest, expense) => Math.max(latest, Date.parse(expense.occurred_on || expense.created_at) || 0), Date.parse(group.created_at) || 0);
    active.sort((a, b) => latestActivity(b) - latestActivity(a));
    settled.sort((a, b) => latestActivity(b) - latestActivity(a));
    archived.sort((a, b) => latestActivity(b) - latestActivity(a));
    return { active, settled, archived };
  }, [accountGroups, currentUser.id, expensesByGroup]);
  const recentExpenses = useMemo(() => accountExpenses.filter((expense) => expense.sync_status !== 'pending' && expense.sync_status !== 'failed')
    .sort((a, b) => (b.occurred_on || b.created_at).localeCompare(a.occurred_on || a.created_at)).slice(0, 4), [accountExpenses]);
  const unconfirmedRecords = accountGroups.reduce((count, group) => {
    const records = countUnconfirmedGroupRecords(group, expensesByGroup.get(group.id) ?? []);
    return count + records.pending + records.failed;
  }, 0);
  const expenseGroup = accountGroups.find((group) => group.id === expenseGroupId);
  const ledgerGroup = accountGroups.find((group) => group.id === ledgerGroupId);
  const splitTransaction = transactions.find((transaction) => transaction.id === splitTransactionId && transaction.type === 'expense');
  const recentTrackedExpenses = useMemo(() => transactions.filter((transaction) => transaction.type === 'expense' && transaction.user_id === currentUser.id)
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)).slice(0, 12), [transactions, currentUser.id]);
  const landingState = resolveGroupsLandingState({
    hasUser: Boolean(user), demoMode: isDemoModeEnabled(), groupCount: accountGroups.length,
    syncStatus, cachedAt, syncError,
  });

  useEffect(() => {
    const transactionId = route.params?.transactionId;
    if (!transactionId) return;
    const transaction = transactions.find((item) => item.id === transactionId && item.type === 'expense');
    navigation.setParams({ transactionId: undefined });
    if (!transaction) return;
    setSplitTransactionId(transaction.id);
    const availableGroups = accountGroups.filter((group) => !group.archived);
    if (availableGroups.length === 1) setExpenseGroupId(availableGroups[0].id);
    else if (availableGroups.length > 1) setGroupPickerVisible(true);
    else setCreateVisible(true);
  }, [accountGroups, navigation, route.params?.transactionId, transactions]);

  useEffect(() => {
    if (!route.params?.startSplit) return;
    navigation.setParams({ startSplit: undefined });
    const availableGroups = accountGroups.filter((group) => !group.archived);
    if (availableGroups.length === 1) setExpenseGroupId(availableGroups[0].id);
    else if (availableGroups.length > 1) setGroupPickerVisible(true);
    else {
      setCreateForSplit(true);
      setCreateVisible(true);
    }
  }, [accountGroups, navigation, route.params?.startSplit]);

  const handleArchive = (group: Group) => {
    const action = group.archived ? restoreGroup : archiveGroup;
    void action(group.id).catch(() => Alert.alert('Group update not confirmed', 'Check your connection and try again.'));
    setLedgerGroupId(undefined);
  };

  const openExpensePicker = () => {
    setActionVisible(false);
    setSplitTransactionId(undefined);
    if (grouped.active.length + grouped.settled.length === 1) {
      setExpenseGroupId((grouped.active[0] ?? grouped.settled[0]).id);
    } else {
      setGroupPickerVisible(true);
    }
  };

  const pickTrackedExpense = (transactionId: string) => {
    setTransactionPickerVisible(false);
    setSplitTransactionId(transactionId);
    const availableGroups = [...grouped.active, ...grouped.settled];
    if (availableGroups.length === 1) setExpenseGroupId(availableGroups[0].id);
    else if (availableGroups.length > 1) setGroupPickerVisible(true);
    else setCreateVisible(true);
  };

  const renderGroup = (group: Group) => (
    <View key={group.id} style={{ marginBottom: Spacing.sm }}>
      <GroupSummaryCard
        group={group}
        expenses={expensesByGroup.get(group.id) ?? []}
        currentUserId={currentUser.id}
        currencySymbol={currencySymbol}
        onAddExpense={() => setExpenseGroupId(group.id)}
        onOpenLedger={() => setLedgerGroupId(group.id)}
      />
      {group.sync_status && group.sync_status !== 'confirmed' ? (
        <PressableScale accessibilityRole="button" accessibilityLabel={`Check confirmation for ${group.name}`} onPress={() => void retryGroupSync(group.id).catch(() => Alert.alert('Still awaiting confirmation', 'Check your connection and try again.'))} style={{ alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, paddingHorizontal: Spacing.sm }}>
          <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs }}>{group.sync_error ? 'Retry confirmation' : 'Awaiting confirmation'}</Text>
        </PressableScale>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: basicMode ? 48 : Math.max(120, contentPaddingBottom) }]} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', flexDirection: 'row', minHeight: 48, marginBottom: Spacing.md }}>
          {basicMode ? <PressableScale accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} style={{ alignItems: 'center', justifyContent: 'center', height: 48, width: 48 }}><AppIcon name="arrow-left" size={23} color={colors.textPrimary} /></PressableScale> : <View style={{ width: 48 }} />}
          <Text accessibilityRole="header" style={{ color: colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['2xl'], letterSpacing: -0.5, lineHeight: 29, textAlign: 'center' }}>Groups</Text>
          <PressableScale accessibilityRole="button" accessibilityLabel="New shared expense or group" onPress={() => setActionVisible(true)} style={{ alignItems: 'center', justifyContent: 'center', height: 48, width: 48, borderColor: colors.borderLight, borderWidth: 1, borderRadius: BorderRadius.full }}>
            <AppIcon name="plus" size={23} color={colors.textPrimary} />
          </PressableScale>
        </View>

        {landingState === 'sign-in' ? (
          <ScreenState
            icon="account-group-outline"
            title="Share expenses together"
            body="Track trips, household bills and other shared spending in one place. Sign in to get started."
            actionLabel={user ? 'Check account' : 'Sign in'}
            onAction={() => user ? navigation.navigate('Profile') : void signOut()}
          />
        ) : landingState === 'loading' ? (
          <ScreenState loading title="Loading your groups" body="Getting your shared spending ready." />
        ) : landingState === 'connection-error' ? (
          <ScreenState
            icon="cloud-alert-outline"
            title="Couldn't load your groups"
            body="Check your connection and try again."
            actionLabel="Retry"
            onAction={() => void syncRemoteState({ force: true, keepLocalData: true })}
          />
        ) : (
          <>
            {accountGroups.length > 0 ? (
              <>
                <View accessible accessibilityLabel={`You're owed ${formatPaise(position.owedPaise, currencySymbol)}. You owe ${formatPaise(position.owePaise, currencySymbol)}.`} style={{ borderBottomColor: colors.borderLight, borderBottomWidth: 1, flexDirection: 'row', gap: Spacing.lg, paddingBottom: Spacing.xl, paddingTop: Spacing.md }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: TransactionDirectionColorOnDark.credit, backgroundColor: colors.textPrimary, alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, letterSpacing: 0.8, textTransform: 'uppercase' }}>You are owed</Text>
                    <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: 27, marginTop: Spacing.xs }}>{formatPaise(position.owedPaise, currencySymbol)}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: TransactionDirectionColorOnDark.debit, backgroundColor: colors.textPrimary, alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, letterSpacing: 0.8, textTransform: 'uppercase' }}>You owe</Text>
                    <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: 27, marginTop: Spacing.xs }}>{formatPaise(position.owePaise, currencySymbol)}</Text>
                  </View>
                </View>
                {!isOnline || syncStatus === 'failed' ? <Text accessibilityRole="alert" style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: Spacing.md }}>Showing saved groups. Balances include confirmed records only.</Text> : null}
                {unconfirmedRecords > 0 ? <Text accessibilityRole="alert" style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: Spacing.sm }}>{unconfirmedRecords} {unconfirmedRecords === 1 ? 'change' : 'changes'} awaiting confirmation. These are not included in your balances.</Text> : null}
                {grouped.active.length === 0 && grouped.settled.length > 0 ? (
                  <View style={{ paddingVertical: Spacing.xl }}>
                    <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize.xl }}>You're all settled</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: 4 }}>No outstanding shared balances.</Text>
                  </View>
                ) : null}
                {grouped.active.length > 0 ? (
                  <View style={{ marginTop: Spacing.xl }}>
                    <SectionTitle title="Active groups" />
                    {grouped.active.map(renderGroup)}
                  </View>
                ) : null}
                {grouped.settled.length > 0 ? (
                  <View style={{ marginTop: grouped.active.length ? Spacing.xl : 0 }}>
                    <SectionTitle title={grouped.active.length ? 'Settled groups' : 'Your groups'} />
                    {grouped.settled.map(renderGroup)}
                  </View>
                ) : null}
                {recentExpenses.length > 0 ? (
                  <View style={{ marginTop: Spacing.xl }}>
                    <SectionTitle title="Recent shared expenses" />
                    {recentExpenses.map((expense) => {
                      const group = accountGroups.find((item) => item.id === expense.group_id);
                      const date = new Date(`${expense.occurred_on || expense.created_at.slice(0, 10)}T12:00:00`);
                      return (
                        <PressableScale key={expense.id} accessibilityRole="button" accessibilityLabel={`${expense.description}, ${formatPaise(getExpensePaise(expense), currencySymbol)}, ${group?.name ?? 'Group'}`} onPress={() => setLedgerGroupId(expense.group_id)} style={{ borderBottomColor: colors.borderLight, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', minHeight: 64, gap: Spacing.sm }}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md }}>{expense.description}</Text>
                            <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: 3 }}>{group?.name ?? 'Group'} · {expense.paid_by === currentUser.id ? 'You paid' : `${expense.paid_by_name || 'A member'} paid`}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', maxWidth: '36%' }}>
                            <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>{formatPaise(getExpensePaise(expense), currencySymbol)}</Text>
                            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: 3 }}>{Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                          </View>
                        </PressableScale>
                      );
                    })}
                  </View>
                ) : null}
                {grouped.archived.length > 0 ? (
                  <View style={{ marginTop: Spacing.xl }}>
                    <SectionTitle title="Archived groups" />
                    {grouped.archived.map(renderGroup)}
                  </View>
                ) : null}
              </>
            ) : (
              <ScreenState
                icon="account-multiple-plus-outline"
                title="No groups yet"
                body="Create a group for trips, flat expenses or anything you pay for together."
                actionLabel="Create group"
                onAction={() => setCreateVisible(true)}
              />
            )}
          </>
        )}
      </ScrollView>

      <ModalSheet visible={actionVisible} title="New" subtitle="Choose what you'd like to do." onClose={() => setActionVisible(false)}>
        <MenuAction icon="account-multiple-plus-outline" label="Create group" detail="For ongoing shared spending" onPress={() => { setActionVisible(false); setCreateVisible(true); }} />
        {grouped.active.length + grouped.settled.length > 0 ? (
          <MenuAction icon="receipt-text-plus-outline" label="Add group expense" detail="Split a payment with people in a group" onPress={openExpensePicker} />
        ) : null}
        {recentTrackedExpenses.length > 0 ? <MenuAction icon="swap-horizontal" label="Split tracked expense" detail="Start with a transaction already in MoneyKai" onPress={() => { setActionVisible(false); setTransactionPickerVisible(true); }} /> : null}
      </ModalSheet>
      <ModalSheet visible={transactionPickerVisible} title="Split tracked expense" subtitle="Choose an expense to use as the starting point." onClose={() => setTransactionPickerVisible(false)}>
        {recentTrackedExpenses.map((transaction) => (
          <MenuAction key={transaction.id} icon="receipt-text-outline" label={transaction.description || 'Expense'} detail={`${formatPaise(Math.round(transaction.amount * 100), currencySymbol)} · ${transaction.transaction_date.slice(0, 10)}`} onPress={() => pickTrackedExpense(transaction.id)} />
        ))}
      </ModalSheet>
      <ModalSheet visible={groupPickerVisible} title="Choose a group" subtitle="Add a shared expense to this group." onClose={() => setGroupPickerVisible(false)}>
        {[...grouped.active, ...grouped.settled].map((group) => (
          <MenuAction key={group.id} icon="account-group-outline" label={group.name} detail={`${Math.max(group.members?.length ?? 0, 1)} people`} onPress={() => { setGroupPickerVisible(false); setExpenseGroupId(group.id); }} />
        ))}
      </ModalSheet>
      <SharedGroupCreateSheet visible={createVisible} currentUser={currentUser} onClose={() => { setCreateVisible(false); setCreateForSplit(false); }} onCreate={async (draft) => {
        const created = await addGroup(draft);
        if (splitTransactionId || createForSplit) setExpenseGroupId(created.id);
        setCreateForSplit(false);
        return created;
      }} />
      <SharedExpenseFlowSheet
        visible={Boolean(expenseGroup)}
        group={expenseGroup}
        currentUser={currentUser}
        currencySymbol={currencySymbol}
        initialTransaction={splitTransaction}
        onClose={() => { setExpenseGroupId(undefined); setSplitTransactionId(undefined); }}
        onAdd={addGroupExpense}
        onAddPeople={addPeopleToGroup}
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

function SectionTitle({ title }: { title: string }) {
  const { colors } = useTheme();
  return <Text accessibilityRole="header" style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize.xl, marginBottom: Spacing.md }}>{title}</Text>;
}

function MenuAction({ icon, label, detail, onPress }: { icon: string; label: string; detail: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ alignItems: 'center', borderBottomColor: colors.borderLight, borderBottomWidth: 1, flexDirection: 'row', gap: Spacing.md, minHeight: 68 }}>
      <AppIcon name={icon} size={22} color={colors.textPrimary} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md }}>{label}</Text>
        <Text numberOfLines={2} style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: 2 }}>{detail}</Text>
      </View>
      <AppIcon name="chevron-right" size={20} color={colors.textSecondary} />
    </PressableScale>
  );
}
