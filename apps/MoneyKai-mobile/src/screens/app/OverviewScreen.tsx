import React, { useCallback, useMemo, useState } from 'react';
import { LARGE_SMS_LOCAL_ENABLED } from '@/config/largeSmsFeatures';
import { useLocalLedgerStore } from '@/stores/useLocalLedgerStore';
import { PanResponder, ScrollView, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompositeNavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  FeatureCanvas,
  SectionHeading,
  SignalPill,
} from '@/components/ui/EditorialLayout';
import { PressableScale } from '@/components/ui/PressableScale';
import { AppIcon } from '@/components/ui/AppIcon';
import { ScreenState } from '@/components/ui/ScreenState';
import { DashboardTrendCard } from '@/components/dashboard/DashboardTrendCard';
import { HomeBasicSummary } from '@/components/dashboard/HomeBasicSummary';
import { HomeModeDrawer } from '@/components/dashboard/HomeModeDrawer';
import { HomeSidebarToggle } from '@/components/dashboard/HomeSidebarToggle';
import { HomeTransactionRow } from '@/components/dashboard/HomeTransactionRow';
import { EditTransactionSheet } from '@/components/ui/EditTransactionSheet';
import { TransactionDetailSheet } from '@/components/ui/TransactionDetailSheet';
import { getCategoryById } from '@/constants/categories';
import { BorderRadius, NotificationBadgeColor, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { AppTabParamList, RootStackParamList } from '@/navigation/types';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useHomeModeStore } from '@/stores/useHomeModeStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { syncRemoteState } from '@/services/remoteSync';
import { isDemoModeEnabled } from '@/config/environment';
import { filterTransactionsByMonth, getMonthKey } from '@/utils/dashboard';
import { titleCase } from '@/utils/labels';
import { useTransactionLabels } from '@/hooks/useTransactionLabels';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionPreferencesStore } from '@/stores/useTransactionPreferencesStore';
import { formatPaise } from '@/utils/groupExpense';
import { buildMonthlyBudgetOverview } from '@/utils/spendingRunway';
import { isHomeDrawerSwipe } from '@/utils/homeDrawerGesture';
import { getFloatingDockLayout } from '@/utils/floatingDockLayout';
import { sortTransactionsForHistory } from '@/utils/transactionHistory';
import { createAppScreenStyles, formatDate } from './screenStyles';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function OverviewScreen() {
  const navigation = useNavigation<HomeNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const homeMode = useHomeModeStore((state) => state.mode);
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { contentPaddingBottom } = getFloatingDockLayout(fontScale, insets.bottom, homeMode === 'basic');
  const setHomeMode = useHomeModeStore((state) => state.setMode);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const edgeSwipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      gesture.x0 <= 72 && isHomeDrawerSwipe(gesture.dx, gesture.dy, 'open', 16),
    onPanResponderRelease: (_, gesture) => {
      if (isHomeDrawerSwipe(gesture.dx, gesture.dy, 'open', 64)) openDrawer();
    },
  }), [openDrawer]);
  const legacyTransactions = useTransactionStore((state) => state.transactions);
  const localRecent=useLocalLedgerStore(s=>s.recent);
  const summaries=useLocalLedgerStore(s=>s.summaryItems);
  const ledgerReady=useLocalLedgerStore(s=>s.ready);
  const ledgerOwner=useLocalLedgerStore(s=>s.owner);
  const transactions=LARGE_SMS_LOCAL_ENABLED?localRecent:legacyTransactions;
  const owner = useAuthStore(state => state.user?.id);
  const archived = useTransactionPreferencesStore(state => owner ? state.archived[owner] : undefined);
  const displayName = useTransactionLabels();
  const selectedTransaction = transactions.find((item) => item.id === selectedTransactionId);
  const editingTransaction = transactions.find((item) => item.id === editingTransactionId);
  const monthlyAllowance = useBudgetStore((state) => state.settings.monthly_allowance);
  const [today, setToday] = useState(() => new Date());
  useFocusEffect(useCallback(() => {
    setToday(new Date());
    if(LARGE_SMS_LOCAL_ENABLED && useLocalLedgerStore.getState().ready) void useLocalLedgerStore.getState().refreshOverview().catch(()=>undefined);
    return () => setDrawerOpen(false);
  }, []));
  const syncStatus = useSyncStore((state) => state.status);
  const syncError = useSyncStore((state) => state.error);
  const isOnline = useSyncStore((state) => state.isOnline);
  const cachedAt = useSyncStore((state) => state.lastCacheHydratedAt);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const monthKey = getMonthKey(today);
  const monthTransactions = useMemo(() => filterTransactionsByMonth(transactions, monthKey), [monthKey, transactions]);
  const budgetOverview = useMemo(() => buildMonthlyBudgetOverview(
    monthlyAllowance,
    LARGE_SMS_LOCAL_ENABLED?[summaries.filter(s=>s.category==='' && s.direction==='expense').reduce((sum,s)=>sum+s.amountMinor,0)/100]:monthTransactions.filter((item) => item.type === 'expense' && item.semantics!=='transfer').map((item) => item.amount),
    today,
  ), [monthlyAllowance, monthTransactions, today,summaries]);
  const monthExpenses = useMemo(() => monthTransactions.filter((item) => item.type === 'expense'), [monthTransactions]);
  const spentThisMonth = useMemo(() => LARGE_SMS_LOCAL_ENABLED?summaries.filter(s=>s.category==='' && s.direction==='expense').reduce((sum,s)=>sum+s.amountMinor,0)/100:monthExpenses.reduce((total,item)=>total+item.amount,0), [monthExpenses,summaries]);
  const recentTransactions = useMemo(() => sortTransactionsForHistory(transactions.filter(item => item.user_id === owner && !archived?.[item.id]), 'newest')
    .slice(0, homeMode === 'basic' ? 10 : 4), [archived, owner, homeMode, transactions]);
  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const categoryName = (categoryId: string) => getCategoryById(categoryId)?.name ?? titleCase(categoryId);
  const budgetLabel = budgetOverview.state === 'no-budget' ? 'Set your monthly budget' : 'Available to spend';
  const budgetDescription = budgetOverview.state === 'no-budget'
    ? 'Set a monthly budget to see your daily amount.'
    : budgetOverview.state === 'overspent'
      ? `Budget exceeded by ${formatPaise(budgetOverview.overBudgetPaise, currencySymbol)} this month.`
      : budgetOverview.state === 'exhausted'
        ? 'No budget left to use this month.'
        : `Remaining budget per day: ${formatPaise(budgetOverview.dailyAvailablePaise, currencySymbol)} until month-end.`;
  const drawerAccess = <HomeModeDrawer open={drawerOpen} mode={homeMode} onClose={closeDrawer} onOpenTool={(tool) => navigation.navigate(tool)} onSelectMode={(mode) => { setHomeMode(mode); closeDrawer(); }} />;

  const hasUsableFinancialState = LARGE_SMS_LOCAL_ENABLED?(ledgerReady && ledgerOwner===owner):isDemoModeEnabled() || syncStatus === 'synced' || Boolean(cachedAt) || transactions.length > 0;
  if (!hasUsableFinancialState) {
    const loading = syncStatus !== 'failed' && isOnline;
    return (
      <SafeAreaView {...edgeSwipe.panHandlers} edges={['top']} style={styles.safeArea}>
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 48 }}>
            <HomeSidebarToggle expanded={drawerOpen} onPress={openDrawer} />
            <MastheadButton icon="bell-outline" label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : 'Open notifications'} onPress={() => navigation.navigate('Notifications')} badge={unreadCount > 0} />
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', padding: Spacing.xl }}>
          <ScreenState
            loading={loading}
            icon={loading ? undefined : 'cloud-alert-outline'}
            title={loading ? 'Loading overview' : isOnline ? 'Overview could not load' : 'You are offline'}
            body={loading ? 'Getting your confirmed income and spending records.' : syncError ? 'We could not refresh your records. Check your connection and try again.' : 'No saved records are available on this device yet.'}
            actionLabel={loading ? undefined : 'Retry'}
            onAction={loading ? undefined : () => void syncRemoteState({ force: true, keepLocalData: true })}
          />
        </View>
        {drawerAccess}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView {...edgeSwipe.panHandlers} edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 48 }}>
          <HomeSidebarToggle expanded={drawerOpen} onPress={openDrawer} />
          {homeMode === 'basic' ? <Text style={{ color: colors.textTertiary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs, letterSpacing: 1, textTransform: 'uppercase' }}>Basic view</Text> : null}
          <MastheadButton icon="bell-outline" label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : 'Open notifications'} onPress={() => navigation.navigate('Notifications')} badge={unreadCount > 0} />
        </View>

        {!isOnline && cachedAt ? <Text accessibilityRole="alert" style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, marginBottom: Spacing.md }}>Offline · showing saved records</Text> : null}
        {homeMode === 'basic' ? (
          <HomeBasicSummary
            available={formatPaise(budgetOverview.remainingPaise, currencySymbol)}
            hasBudget={budgetOverview.state !== 'no-budget'}
            spent={formatMoney(spentThisMonth)}
            onOpenBudget={() => navigation.navigate('Budget')}
          />
        ) : (
          <>
        <View style={{ marginBottom: Spacing.sm }}>
          <PressableScale accessibilityRole="button" accessibilityLabel={`${budgetLabel}. ${budgetOverview.state === 'no-budget' ? 'Open budget setup' : `${formatPaise(budgetOverview.remainingPaise, currencySymbol)}. ${budgetDescription} Open budget details`}`} onPress={() => navigation.navigate('Budget')}>
            <View style={{ paddingVertical: Spacing.sm }}>
              <View testID="available-spent-heading" style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.md }}>
                <Text style={{ flexShrink: 1, color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['2xl'] + 2, letterSpacing: -0.5 }}>{budgetLabel}</Text>
                {budgetOverview.state !== 'no-budget' ? <Text accessibilityLabel={`${formatMoney(spentThisMonth)} spent this month`} style={{ flexShrink: 1, textAlign: 'right', color: colors.textSecondary, fontSize: Typography.fontSize.sm }}><Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold }}>{formatMoney(spentThisMonth)}</Text> spent this month</Text> : null}
              </View>
              <View style={{ gap: Spacing.sm, marginTop: Spacing.xs }}>
                <Text accessibilityLabel={budgetOverview.state === 'no-budget' ? 'No monthly budget set' : `${formatPaise(budgetOverview.remainingPaise, currencySymbol)} available to spend`} adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['5xl'], letterSpacing: -1.5 }}>
                  {budgetOverview.state === 'no-budget' ? '—' : formatPaise(budgetOverview.remainingPaise, currencySymbol)}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.md, marginTop: Spacing.md }}>{budgetDescription}</Text>
            </View>
          </PressableScale>
        </View>
          </>
        )}

        {LARGE_SMS_LOCAL_ENABLED?<Text style={{color:colors.textSecondary,marginBottom:Spacing.md}}>Phone totals include your complete local ledger. Website totals include synchronized records.</Text>:null}
        <SectionHeading
          compact
          title="Recent transactions"
          action={(
            <PressableScale accessibilityLabel="View all transactions" accessibilityRole="button" onPress={() => navigation.navigate('Transactions')} style={{ justifyContent: 'center', minHeight: 48, minWidth: 48 }}>
              <Text style={{ color: colors.primaryDark, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>View all ›</Text>
            </PressableScale>
          )}
        />

        <FeatureCanvas tone="paper" style={{ paddingBottom: Spacing.sm, paddingTop: Spacing.sm }}>
          {recentTransactions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing['2xl'] }}>
              <AppIcon color={colors.accent} name="receipt" size={30} />
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize.xl, marginTop: Spacing.md }}>No transactions yet</Text>
              <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20, marginTop: 4, textAlign: 'center' }}>Confirmed income and spending will appear here.</Text>
              <PressableScale accessibilityRole="button" onPress={() => navigation.navigate('Add')} style={{ marginTop: Spacing.lg }}>
                <SignalPill icon="plus" label="Add the first record" strong />
              </PressableScale>
            </View>
          ) : recentTransactions.map((item, index) => (
            <HomeTransactionRow key={item.id} title={displayName(item) || categoryName(item.category)} fullTitle={displayName(item)} detail={`${categoryName(item.category)} · ${formatDate(item.transaction_date)}`} amount={`${item.type === 'income' ? '+' : '-'}${formatMoney(item.amount)}`} income={item.type === 'income'} last={index === recentTransactions.length - 1} onPress={() => setSelectedTransactionId(item.id)} />
          ))}
        </FeatureCanvas>
        {homeMode === 'advanced' && !LARGE_SMS_LOCAL_ENABLED ? (
          <View style={{ marginTop: Spacing.xl }}>
            <DashboardTrendCard now={today} compact onConfigure={() => navigation.navigate('GraphInsights')} graphAction={{ kind: 'graphs', onPress: () => navigation.navigate('GraphInsights') }} />
          </View>
        ) : null}
      </ScrollView>
      {drawerAccess}
      {editingTransaction ? <EditTransactionSheet key={editingTransaction.id} transaction={editingTransaction} onClose={() => setEditingTransactionId(null)} /> : null}
      {selectedTransaction ? (
        <TransactionDetailSheet
          key={selectedTransaction.id}
          transaction={selectedTransaction}
          onClose={() => setSelectedTransactionId(null)}
          onEdit={() => { setSelectedTransactionId(null); setEditingTransactionId(selectedTransaction.id); }}
          onSplit={() => { setSelectedTransactionId(null); navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('App', { screen: 'Groups', params: { transactionId: selectedTransaction.id } }); }}
          onDeleted={() => setSelectedTransactionId(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function MastheadButton({ badge, icon, label, onPress }: { badge?: boolean; icon: string; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={{ alignItems: 'center', height: 48, justifyContent: 'center', width: 48 }}>
      <View style={{ alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: BorderRadius.full, height: 32, justifyContent: 'center', width: 32 }}>
        <AppIcon color={colors.textPrimary} name={icon} size={21} />
        {badge ? <View style={{ backgroundColor: NotificationBadgeColor, borderColor: colors.background, borderRadius: 5, borderWidth: 1, height: 9, position: 'absolute', right: 0, top: 0, width: 9 }} /> : null}
      </View>
    </PressableScale>
  );
}

