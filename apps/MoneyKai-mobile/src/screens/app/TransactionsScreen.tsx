import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Platform, SectionList, TextInput, View, useWindowDimensions, type SectionListRenderItemInfo } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenState } from '@/components/ui/ScreenState';
import { CenteredPageHeader } from '@/components/ui/CenteredPageHeader';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { filterGraphTransactions, getGraphRangeLabel, GRAPH_METRIC_OPTIONS, type GraphTransactionContext } from '@/utils/dashboardGraph';
import { EditTransactionSheet } from '@/components/ui/EditTransactionSheet';
import { TransactionDetailSheet } from '@/components/ui/TransactionDetailSheet';
import { SmsParserDialog } from '@/components/capture/SmsParserDialog';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useHomeModeStore } from '@/stores/useHomeModeStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, TransactionDirectionColor, Typography } from '@/constants/theme';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, getCategoryById } from '@/constants/categories';
import type { AppTabParamList } from '@/navigation/types';
import type { TransactionType } from '@/types/transaction';
import type { Transaction } from '@/types/transaction';
import { titleCase } from '@/utils/labels';
import { useTransactionLabels } from '@/hooks/useTransactionLabels';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionPreferencesStore } from '@/stores/useTransactionPreferencesStore';
import { ActivityControlsSheet, ACTIVITY_SORT_OPTIONS as SORT_OPTIONS } from '@/components/transactions/ActivityControlsSheet';
import { TransactionDownloadSheet } from '@/components/transactions/TransactionDownloadSheet';
import { ArchiveSwipeRow } from '@/components/transactions/ArchiveSwipeRow';
import { activityDateLabel, initialActivityDates, matchesActivityDate } from '@/utils/activityDates';
import { buildTransactionHistorySections, type TransactionHistorySortOption } from '@/utils/transactionHistory';
import { getFloatingDockLayout } from '@/utils/floatingDockLayout';
import { createAppScreenStyles, formatDate } from './screenStyles';

type TransactionsNavigation = BottomTabNavigationProp<AppTabParamList, 'Transactions'>;
type SortOption = TransactionHistorySortOption;

const CAPTURE_SOURCE_OPTIONS = [
  { id: 'sms', label: 'SMS', icon: 'message-processing-outline' },
  { id: 'notification', label: 'Notifications', icon: 'bell-badge-outline' },
  { id: 'aa', label: 'Account Aggregator', icon: 'bank-transfer' },
  { id: 'gmail', label: 'Gmail', icon: 'gmail' },
  { id: 'pdf', label: 'PDF Statements', icon: 'file-document-outline' },
  { id: 'portfolio', label: 'Portfolio', icon: 'chart-timeline-variant' },
  { id: 'manual', label: 'Manual', icon: 'pencil-outline' },
] as const;

type FilterValue = 'all' | string;

interface TransactionRowProps {
  transaction: Transaction;
  amountLabel: string;
  categoryLabel: string;
  dateLabel: string;
  paymentLabel: string;
  onOpen: (transaction: Transaction) => void;
}

const TransactionRow = React.memo(function TransactionRow({
  transaction,
  amountLabel,
  categoryLabel,
  dateLabel,
  paymentLabel,
  onOpen,
}: TransactionRowProps) {
  const { colors } = useTheme();
  const isIncome = transaction.type === 'income';
  const displayName = useTransactionLabels();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderBottomColor: colors.borderLight,
        borderBottomWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
      }}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Open ${transaction.description || categoryLabel} transaction, ${amountLabel}`}
        accessibilityHint="Shows the full description and actions to edit or delete"
        onPress={() => onOpen(transaction)}
        pressedScale={0.99}
        style={{ alignItems: 'center', flexDirection: 'row', minHeight: 56 }}
      >
        <View style={{ alignItems: 'center', flexDirection: 'row', flex: 1, minWidth: 0, paddingRight: Spacing.md }}>
          <View
            style={{
              alignItems: 'center',
              backgroundColor: colors.surfaceElevated,
              borderRadius: BorderRadius.full,
              height: 36,
              justifyContent: 'center',
              marginRight: Spacing.md,
              width: 36,
            }}
          >
            <AppIcon
              name={isIncome ? 'arrow-down-left' : 'arrow-up-right'}
              size={18}
              color={isIncome ? TransactionDirectionColor.credit : TransactionDirectionColor.debit}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              accessibilityLabel={transaction.description || categoryLabel}
              style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm + 2 }}
            >
              {displayName(transaction) || categoryLabel}
            </Text>
            <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: 2 }}>
              {categoryLabel} · {paymentLabel} · {dateLabel}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'center', flexDirection: 'row', flexShrink: 0, gap: Spacing.xs, maxWidth: 142 }}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={{
              color: isIncome ? TransactionDirectionColor.credit : TransactionDirectionColor.debit,
              fontFamily: Typography.fontFamily.semiBold,
              fontSize: Typography.fontSize.sm + 2,
              maxWidth: 112,
            }}
          >
            {amountLabel}
          </Text>
          <AppIcon name="chevron-right" size={18} color={colors.textTertiary} />
        </View>
      </PressableScale>
    </View>
  );
});

export function TransactionsScreen({ graphContext, archivedOnly = false }: { graphContext?: GraphTransactionContext; archivedOnly?: boolean } = {}) {
  const [showSmsParser, setShowSmsParser] = useState(false);
  const navigation = useNavigation<TransactionsNavigation>();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const basicMode = useHomeModeStore((state) => state.mode === 'basic');
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentPaddingBottom = basicMode || graphContext ? Spacing.xl : getFloatingDockLayout(fontScale, insets.bottom, false).contentPaddingBottom;
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const allTransactions = useTransactionStore((state) => state.transactions);
  const owner = useAuthStore(state => state.user?.id);
  const transactions = useMemo(() => allTransactions.filter(item => item.user_id === owner), [allTransactions, owner]);
  const archived = useTransactionPreferencesStore(state => owner ? state.archived[owner] : undefined);
  const setArchived = useTransactionPreferencesStore(state => state.setArchived);
  const displayName = useTransactionLabels();
  const scopedTransactions = useMemo(() => graphContext ? filterGraphTransactions(transactions, graphContext) : transactions, [transactions, graphContext]);
  const isLoading = useTransactionStore((state) => state.isLoading);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<FilterValue>('all');
  const [paymentFilter, setPaymentFilter] = useState<FilterValue>('all');
  const [accountFilter, setAccountFilter] = useState<FilterValue>('all');
  const [sourceFilter, setSourceFilter] = useState<FilterValue>('all');
  const [dates, setDates] = useState(initialActivityDates);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const formatCategory = useCallback((categoryId: string) => getCategoryById(categoryId)?.name ?? titleCase(categoryId), []);
  const formatPaymentMethod = useCallback((methodId: string) => PAYMENT_METHODS.find((item) => item.id === methodId)?.name ?? titleCase(methodId), []);
  const categoryOptions = type === 'expense' ? EXPENSE_CATEGORIES : type === 'income' ? INCOME_CATEGORIES : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  const accountOptions = useMemo(() => {
    const options = new Map<string, string>();
    transactions.forEach((transaction) => {
      if (transaction.captureAccountId) {
        options.set(transaction.captureAccountId, transaction.captureAccountLabel ?? transaction.captureBankLabel ?? transaction.captureAccountId);
      }
    });
    return Array.from(options, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions]);
  const sourceOptions = useMemo(() => {
    const sources = new Set(transactions.map((transaction) => transaction.captureSource).filter(Boolean));
    return CAPTURE_SOURCE_OPTIONS.filter((option) => sources.has(option.id));
  }, [transactions]);
  const activeFilterCount =
    Number(type !== 'all') +
    Number(categoryFilter !== 'all') +
    Number(paymentFilter !== 'all') +
    Number(accountFilter !== 'all') +
    Number(sourceFilter !== 'all') +
    Number(dates.id !== 'all');
  const sortLabel = SORT_OPTIONS.find((option) => option.id === sortOption)?.label ?? 'Newest first';
  const typeLabel = type === 'all' ? 'All' : type === 'expense' ? 'Debit' : 'Credit';
  const activeFilterLabels = [
    type !== 'all' ? typeLabel : null,
    categoryFilter !== 'all' ? formatCategory(categoryFilter) : null,
    paymentFilter !== 'all' ? formatPaymentMethod(paymentFilter) : null,
    sourceFilter !== 'all' ? CAPTURE_SOURCE_OPTIONS.find((option) => option.id === sourceFilter)?.label : null,
    accountFilter !== 'all' ? accountOptions.find((option) => option.id === accountFilter)?.name : null,
    dates.id !== 'all' ? activityDateLabel(dates) : null,
  ].filter(Boolean).join(' · ');

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const nextTransactions = scopedTransactions
      .filter(item => Boolean(archived?.[item.id]) === archivedOnly)
      .filter((item) => (type === 'all' || item.type === type))
      .filter((item) => (categoryFilter === 'all' || item.category === categoryFilter))
      .filter((item) => (paymentFilter === 'all' || item.payment_method === paymentFilter))
      .filter((item) => (accountFilter === 'all' || item.captureAccountId === accountFilter))
      .filter((item) => (sourceFilter === 'all' || item.captureSource === sourceFilter))
      .filter(item => matchesActivityDate(item.transaction_date, dates))
      .filter((item) => {
        if (!normalizedQuery) return true;
        return (
          item.description.toLowerCase().includes(normalizedQuery) ||
          displayName(item).toLowerCase().includes(normalizedQuery) ||
          formatCategory(item.category).toLowerCase().includes(normalizedQuery) ||
          formatPaymentMethod(item.payment_method).toLowerCase().includes(normalizedQuery) ||
          (item.contact_allocations?.some((person) => person.name.toLowerCase().includes(normalizedQuery)) ?? false) ||
          (item.captureAccountLabel?.toLowerCase().includes(normalizedQuery) ?? false) ||
          (item.captureBankLabel?.toLowerCase().includes(normalizedQuery) ?? false)
        );
      });

    return nextTransactions;
  }, [accountFilter, categoryFilter, dates, archived, archivedOnly, displayName, deferredQuery, formatCategory, formatPaymentMethod, paymentFilter, sourceFilter, scopedTransactions, type]);

  const sections = useMemo(() => buildTransactionHistorySections(filtered, sortOption, displayName), [filtered, sortOption, displayName]);

  const selectedTransaction = useMemo(
    () => transactions.find((transaction) => transaction.id === selectedTransactionId) ?? null,
    [selectedTransactionId, transactions]
  );
  const formatMoney = useCallback(
    (transaction: Transaction) => `${transaction.type === 'income' ? '+' : '-'}${currencySymbol}${transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
    [currencySymbol]
  );
  const openTransaction = useCallback((transaction: Transaction) => {
    setSelectedTransactionId(transaction.id);
  }, []);
  const renderTransaction = useCallback(
    ({ item }: SectionListRenderItemInfo<Transaction>) => {
      const row = <TransactionRow
        transaction={item}
        amountLabel={formatMoney(item)}
        categoryLabel={formatCategory(item.category)}
        dateLabel={formatDate(item.transaction_date)}
        paymentLabel={formatPaymentMethod(item.payment_method)}
        onOpen={openTransaction}
      />;
      return graphContext ? row : <ArchiveSwipeRow restore={archivedOnly} onArchive={() => setArchived(item, !archivedOnly)}>{row}</ArchiveSwipeRow>;
    },
    [archivedOnly, graphContext, setArchived, formatCategory, formatMoney, formatPaymentMethod, openTransaction]
  );
  const selectType = (nextType: TransactionType | 'all') => {
    setType(nextType);
    if (nextType === 'expense' && categoryFilter !== 'all' && !EXPENSE_CATEGORIES.some((category) => category.id === categoryFilter)) {
      setCategoryFilter('all');
    }
    if (nextType === 'income' && categoryFilter !== 'all' && !INCOME_CATEGORIES.some((category) => category.id === categoryFilter)) {
      setCategoryFilter('all');
    }
  };
  const resetFilters = () => {
    setType('all');
    setCategoryFilter('all');
    setPaymentFilter('all');
    setAccountFilter('all');
    setSourceFilter('all');
    setDates(initialActivityDates());
  };
  const resetAllControls = () => {
    setQuery('');
    resetFilters();
    setSortOption('newest');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentPaddingBottom }]}
        initialNumToRender={12}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        maxToRenderPerBatch={8}
        removeClippedSubviews={Platform.OS === 'android'}
        stickySectionHeadersEnabled={false}
        updateCellsBatchingPeriod={32}
        windowSize={7}
        ListHeaderComponent={
          <>
            <CenteredPageHeader title={archivedOnly ? "Archive Transactions" : "Activity"} leftAction={graphContext || archivedOnly ? <ScreenBackButton compact /> : basicMode ? (
              <PressableScale accessibilityRole="button" accessibilityLabel="Back to Home" onPress={() => navigation.navigate('Home')} style={{ alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 }}>
                <AppIcon name="arrow-left" size={23} color={colors.textPrimary} />
              </PressableScale>
            ) : undefined} rightAction={graphContext ? undefined : <PressableScale accessibilityRole="button" accessibilityLabel="Open SMS parser controls" onPress={() => setShowSmsParser(true)} style={{ alignItems: 'center', justifyContent: 'center', minHeight: 48, minWidth: 48 }}><AppIcon name="message-text-outline" size={26} color={colors.textPrimary} /></PressableScale>} />
            {graphContext ? <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, marginBottom: Spacing.md }}>{getGraphRangeLabel(graphContext.range)} · {GRAPH_METRIC_OPTIONS.find((option) => option.id === graphContext.metric)?.label} · {scopedTransactions.length} recorded {scopedTransactions.length === 1 ? 'transaction' : 'transactions'}</Text> : null}
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md }}>
              <View style={{ alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: BorderRadius.md, borderWidth: 1, flex: 1, flexDirection: 'row', minHeight: 44, minWidth: 0, paddingHorizontal: Spacing.sm }}>
                <AppIcon name="magnify" size={19} color={colors.textSecondary} />
                <TextInput
                  accessibilityLabel="Search transactions"
                  accessibilityHint="Search descriptions, categories, payment methods, or accounts"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setQuery}
                  placeholder="Search"
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="search"
                  style={{ color: colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, minWidth: 0, paddingHorizontal: Spacing.sm, paddingVertical: 0 }}
                  value={query}
                />
                {query ? <PressableScale accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setQuery('')}><AppIcon name="close" size={18} color={colors.textSecondary} /></PressableScale> : null}
              </View>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.xs }}>
                <PressableScale accessibilityRole="button" accessibilityLabel={`Filter and sort transactions, ${activeFilterCount} active filters, ${sortLabel}`} onPress={() => setShowFilterModal(true)} style={{ alignItems: 'center', height: 44, justifyContent: 'center', width: 44 }}>
                  <View style={{ alignItems: 'center', backgroundColor: activeFilterCount > 0 ? colors.primaryBg : colors.card, borderColor: activeFilterCount > 0 ? colors.primary : colors.border, borderRadius: BorderRadius.full, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 }}>
                    <AppIcon name="tune-variant" size={18} color={colors.textSecondary} />
                  </View>
                </PressableScale>
                <PressableScale accessibilityRole="button" accessibilityLabel="Download transaction history" onPress={() => setShowDownload(true)} style={{ alignItems: 'center', height: 44, justifyContent: 'center', width: 44 }}>
                  <View style={{ alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: BorderRadius.full, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 }}>
                    <AppIcon name="download" size={18} color={colors.textSecondary} />
                  </View>
                </PressableScale>
              </View>
            </View>
            <View style={{ marginBottom: Spacing.md }}>
              <Text accessibilityLiveRegion="polite" style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>
                {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'} · {sortLabel}
              </Text>
              {activeFilterLabels ? <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: Spacing.xs }}>Filtered by {activeFilterLabels}</Text> : null}
              {query || activeFilterCount > 0 ? <PressableScale accessibilityRole="button" accessibilityLabel="Clear search and filters" onPress={() => { setQuery(''); resetFilters(); }} style={{ alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44 }}>
                <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>Clear search & filters</Text>
              </PressableScale> : null}
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <ScreenState loading title="Loading transactions" body="Opening your debit and credit history." tone="primary" />
          ) : (
            <ScreenState
              actionLabel={query || activeFilterCount > 0 ? 'Clear filters' : archivedOnly ? 'Open Activity' : 'Add transaction'}
              body={query || activeFilterCount > 0 ? 'Try a different search or remove the current filter.' : archivedOnly ? 'Swipe left in Activity to archive. Swipe left here to restore.' : 'Add your first debit or credit to get started.'}
              icon={query || activeFilterCount > 0 ? 'filter-off-outline' : 'receipt'}
              onAction={() => {
                if (query || activeFilterCount > 0) {
                  resetAllControls();
                } else {
                  if (archivedOnly) rootNavigation.navigate('App', { screen: 'Transactions' });
                  else if (graphContext) rootNavigation.navigate('App', { screen: 'Add' });
                  else navigation.navigate('Add');
                }
              }}
              title={query || activeFilterCount > 0 ? 'No matches found' : archivedOnly ? 'No archived transactions' : 'A fresh start'}
              tone="primary"
            />
          )
        }
        renderSectionHeader={({ section }) => {
          const spendingLabel = `${currencySymbol}${(section.totalSpendingPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          const largeText = fontScale > 1.5;
          return (
            <View
              accessible
              accessibilityRole="header"
              accessibilityLabel={`${section.title}, total spending ${spendingLabel}${query || activeFilterCount > 0 ? ', matching current search and filters' : ''}`}
              style={{ alignItems: largeText ? 'stretch' : 'center', flexDirection: largeText ? 'column' : 'row', gap: Spacing.sm, paddingBottom: Spacing.sm, paddingTop: Spacing.md }}
            >
              <Text style={{ color: colors.accent, flexShrink: 1, fontFamily: Typography.fontFamily.medium, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{section.title}</Text>
              {largeText ? null : <View style={{ backgroundColor: colors.borderLight, flex: 1, height: 1 }} />}
              <Text testID="history-section-spending" style={{ color: colors.textPrimary, flexShrink: 1, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, fontVariant: ['tabular-nums'], textAlign: 'right' }}>{spendingLabel}</Text>
            </View>
          );
        }}
        renderItem={renderTransaction}
      />

      <SmsParserDialog visible={showSmsParser} onClose={() => setShowSmsParser(false)} onOpenParser={() => rootNavigation.navigate('SmsParser')} />
      {showFilterModal ? <ActivityControlsSheet onClose={() => setShowFilterModal(false)} onReset={() => { resetFilters(); setSortOption('newest'); }} dates={dates} onDates={setDates} type={type} onType={selectType} sort={sortOption} onSort={setSortOption} fields={[
        { title: 'Category', value: categoryFilter, onChange: setCategoryFilter, options: [{ id: 'all', name: 'All categories' }, ...categoryOptions] },
        { title: 'Payment method', value: paymentFilter, onChange: setPaymentFilter, options: [{ id: 'all', name: 'All methods' }, ...PAYMENT_METHODS] },
        { title: 'Source', value: sourceFilter, onChange: setSourceFilter, options: [{ id: 'all', name: 'All sources' }, ...sourceOptions.map(option => ({ id: option.id, name: option.label }))] },
        { title: 'Account', value: accountFilter, onChange: setAccountFilter, options: [{ id: 'all', name: 'All accounts' }, ...accountOptions] },
      ]} /> : null}
      {showDownload ? <TransactionDownloadSheet onClose={() => setShowDownload(false)} /> : null}

      {editingTransaction ? (
        <EditTransactionSheet
          key={editingTransaction.id}
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      ) : null}

      {selectedTransaction ? (
        <TransactionDetailSheet
          key={selectedTransaction.id}
          transaction={selectedTransaction}
          onClose={() => setSelectedTransactionId(null)}
          onEdit={() => {
            setSelectedTransactionId(null);
            setEditingTransaction(selectedTransaction);
          }}
          onSplit={() => {
            setSelectedTransactionId(null);
            if (graphContext) rootNavigation.navigate('App', { screen: 'Groups', params: { transactionId: selectedTransaction.id } });
            else navigation.navigate('Groups', { transactionId: selectedTransaction.id });
          }}
          onDeleted={() => setSelectedTransactionId(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}
