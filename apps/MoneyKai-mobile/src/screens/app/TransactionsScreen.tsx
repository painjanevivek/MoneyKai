import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { endOfDay, endOfWeek, isWithinInterval, startOfDay, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenState } from '@/components/ui/ScreenState';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, getCategoryById } from '@/constants/categories';
import type { AppTabParamList } from '@/navigation/types';
import type { TransactionType } from '@/types/transaction';
import type { Transaction } from '@/types/transaction';
import { getMonthKey, getMonthLabel } from '@/utils/dashboard';
import { titleCase } from '@/utils/labels';
import { parseTransactionDate, sortTransactionsForHistory, type TransactionHistorySortOption } from '@/utils/transactionHistory';
import { createAppScreenStyles, formatDate } from './screenStyles';

type TransactionsNavigation = BottomTabNavigationProp<AppTabParamList, 'Transactions'>;
type SortOption = TransactionHistorySortOption;

const DATE_FILTER_OPTIONS = [
  { id: 'all', label: 'All dates' },
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' },
  { id: 'last_30_days', label: 'Last 30 days' },
] as const;

const SORT_OPTIONS: Array<{ id: SortOption; label: string; icon: string }> = [
  { id: 'newest', label: 'Newest first', icon: 'sort-calendar-descending' },
  { id: 'oldest', label: 'Oldest first', icon: 'sort-calendar-ascending' },
  { id: 'amount_high', label: 'Amount high to low', icon: 'sort-numeric-descending' },
  { id: 'amount_low', label: 'Amount low to high', icon: 'sort-numeric-ascending' },
  { id: 'name_az', label: 'Name A to Z', icon: 'sort-alphabetical-ascending' },
  { id: 'name_za', label: 'Name Z to A', icon: 'sort-alphabetical-descending' },
];

const CAPTURE_SOURCE_OPTIONS = [
  { id: 'sms', label: 'SMS', icon: 'message-processing-outline' },
  { id: 'notification', label: 'Notifications', icon: 'bell-badge-outline' },
  { id: 'aa', label: 'Account Aggregator', icon: 'bank-transfer' },
  { id: 'gmail', label: 'Gmail', icon: 'gmail' },
  { id: 'pdf', label: 'PDF Statements', icon: 'file-document-outline' },
  { id: 'portfolio', label: 'Portfolio', icon: 'chart-timeline-variant' },
  { id: 'manual', label: 'Manual', icon: 'pencil-outline' },
] as const;

type DateFilterOption = typeof DATE_FILTER_OPTIONS[number]['id'];
type FilterValue = 'all' | string;

export function TransactionsScreen() {
  const navigation = useNavigation<TransactionsNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const transactions = useTransactionStore((state) => state.transactions);
  const isLoading = useTransactionStore((state) => state.isLoading);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<FilterValue>('all');
  const [paymentFilter, setPaymentFilter] = useState<FilterValue>('all');
  const [accountFilter, setAccountFilter] = useState<FilterValue>('all');
  const [sourceFilter, setSourceFilter] = useState<FilterValue>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
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
    Number(dateFilter !== 'all');
  const sortLabel = SORT_OPTIONS.find((option) => option.id === sortOption)?.label ?? 'Newest first';

  const filtered = useMemo(() => {
    const now = new Date();
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const nextTransactions = transactions
      .filter((item) => (type === 'all' || item.type === type))
      .filter((item) => (categoryFilter === 'all' || item.category === categoryFilter))
      .filter((item) => (paymentFilter === 'all' || item.payment_method === paymentFilter))
      .filter((item) => (accountFilter === 'all' || item.captureAccountId === accountFilter))
      .filter((item) => (sourceFilter === 'all' || item.captureSource === sourceFilter))
      .filter((item) => {
        if (dateFilter === 'all') return true;
        const transactionDate = parseTransactionDate(item.transaction_date);
        switch (dateFilter) {
          case 'today':
            return isWithinInterval(transactionDate, { start: startOfDay(now), end: endOfDay(now) });
          case 'this_week':
            return isWithinInterval(transactionDate, {
              start: startOfWeek(now, { weekStartsOn: 1 }),
              end: endOfWeek(now, { weekStartsOn: 1 }),
            });
          case 'this_month':
            return isWithinInterval(transactionDate, { start: startOfMonth(now), end: endOfDay(now) });
          case 'last_30_days':
            return isWithinInterval(transactionDate, { start: startOfDay(subDays(now, 29)), end: endOfDay(now) });
          default:
            return true;
        }
      })
      .filter((item) => {
        if (!normalizedQuery) return true;
        return (
          item.description.toLowerCase().includes(normalizedQuery) ||
          formatCategory(item.category).toLowerCase().includes(normalizedQuery) ||
          formatPaymentMethod(item.payment_method).toLowerCase().includes(normalizedQuery) ||
          (item.captureAccountLabel?.toLowerCase().includes(normalizedQuery) ?? false) ||
          (item.captureBankLabel?.toLowerCase().includes(normalizedQuery) ?? false)
        );
      });

    return sortTransactionsForHistory(nextTransactions, sortOption);
  }, [accountFilter, categoryFilter, dateFilter, deferredQuery, formatCategory, formatPaymentMethod, paymentFilter, sortOption, sourceFilter, transactions, type]);

  const sections = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    filtered.forEach((transaction) => {
      const monthKey = getMonthKey(transaction.transaction_date);
      const items = grouped.get(monthKey) ?? [];
      items.push(transaction);
      grouped.set(monthKey, items);
    });

    return [...grouped.entries()]
      .sort(([monthA], [monthB]) => monthB.localeCompare(monthA))
      .map(([monthKey, data]) => ({
        title: getMonthLabel(monthKey),
        data: data.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()),
      }));
  }, [filtered]);

  const currentMonthKey = getMonthKey(new Date());
  const parsedSummary = useMemo(
    () =>
      filtered.reduce(
        (summary, transaction) => {
          if (transaction.type === 'income') {
            summary.income += transaction.amount;
          } else {
            summary.expense += transaction.amount;
          }
          if (getMonthKey(transaction.transaction_date) === currentMonthKey) {
            summary.currentMonth += 1;
          }
          return summary;
        },
        { currentMonth: 0, income: 0, expense: 0 }
      ),
    [currentMonthKey, filtered]
  );

  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN')}`;
  const resetFilters = () => {
    setType('all');
    setCategoryFilter('all');
    setPaymentFilter('all');
    setAccountFilter('all');
    setSourceFilter('all');
    setDateFilter('all');
  };
  const resetAllControls = () => {
    setQuery('');
    resetFilters();
    setSortOption('newest');
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete transaction?', 'This removes the saved record from this account and Firestore sync.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Transactions</Text>
              <Text style={styles.subtitle}>Search, filter, and review SMS-parsed records or manual corrections.</Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base }}>
              {[
                { label: 'SMS records', value: String(filtered.length), icon: 'database-check-outline' },
                { label: 'This month', value: String(parsedSummary.currentMonth), icon: 'calendar-check-outline' },
                { label: 'Income', value: formatMoney(parsedSummary.income), icon: 'arrow-down-left' },
                { label: 'Expenses', value: formatMoney(parsedSummary.expense), icon: 'arrow-up-right' },
              ].map((item) => (
                <View
                  key={item.label}
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.borderLight,
                    borderRadius: BorderRadius.sm,
                    borderWidth: 1,
                    flexBasis: '47%',
                    flexGrow: 1,
                    minHeight: 76,
                    minWidth: 140,
                    padding: Spacing.md,
                  }}
                >
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }}>
                    <MaterialCommunityIcons name={item.icon as any} size={17} color={colors.primary} />
                    <Text numberOfLines={1} style={{ color: colors.textSecondary, flex: 1, fontSize: Typography.fontSize.xs }}>
                      {item.label}
                    </Text>
                  </View>
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={{
                      color: colors.textPrimary,
                      fontFamily: Typography.fontFamily.bold,
                      fontSize: Typography.fontSize.lg,
                      marginTop: Spacing.sm,
                    }}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search SMS records"
              icon="magnify"
              autoCapitalize="none"
            />

            <View style={styles.chipRow}>
              {(['all', 'expense', 'income'] as const).map((item) => {
                const active = type === item;
                return (
                  <PressableScale
                    key={item}
                    onPress={() => {
                      setType(item);
                      if (item === 'expense' && categoryFilter !== 'all' && !EXPENSE_CATEGORIES.some((category) => category.id === categoryFilter)) {
                        setCategoryFilter('all');
                      }
                      if (item === 'income' && categoryFilter !== 'all' && !INCOME_CATEGORIES.some((category) => category.id === categoryFilter)) {
                        setCategoryFilter('all');
                      }
                    }}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item === 'all' ? 'All' : item[0].toUpperCase() + item.slice(1)}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base }}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Open transaction filters"
                onPress={() => setShowFilterModal(true)}
                style={{
                  alignItems: 'center',
                  backgroundColor: activeFilterCount > 0 ? colors.primaryBg : colors.card,
                  borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
                  borderRadius: BorderRadius.full,
                  borderWidth: 1,
                  flex: 1,
                  flexDirection: 'row',
                  gap: Spacing.sm,
                  minHeight: 42,
                  justifyContent: 'center',
                  paddingHorizontal: Spacing.md,
                }}
              >
                <MaterialCommunityIcons name="filter-variant" size={17} color={activeFilterCount > 0 ? colors.primary : colors.textSecondary} />
                <Text style={{ color: activeFilterCount > 0 ? colors.primary : colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>
                  {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
                </Text>
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Open transaction sorting"
                onPress={() => setShowSortModal(true)}
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: BorderRadius.full,
                  borderWidth: 1,
                  flex: 1,
                  flexDirection: 'row',
                  gap: Spacing.sm,
                  minHeight: 42,
                  justifyContent: 'center',
                  paddingHorizontal: Spacing.md,
                }}
              >
                <MaterialCommunityIcons name="sort" size={17} color={colors.textSecondary} />
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, maxWidth: 132 }}
                >
                  {sortLabel}
                </Text>
              </PressableScale>
            </View>

            <Button title="Add transaction" onPress={() => navigation.navigate('Add')} icon="plus" style={{ marginBottom: Spacing.base }} />
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <ScreenState loading title="Loading transactions" body="Pulling your latest income and expense history." tone="primary" />
          ) : (
            <ScreenState
              actionLabel={query || activeFilterCount > 0 ? 'Clear filters' : 'Add transaction'}
              body={query || activeFilterCount > 0 ? 'Try a different search or remove the current filter.' : 'SMS captures and manual corrections will appear here after review.'}
              icon={query || activeFilterCount > 0 ? 'filter-off-outline' : 'receipt-text-plus-outline'}
              onAction={() => {
                if (query || activeFilterCount > 0) {
                  resetAllControls();
                } else {
                  navigation.navigate('Add');
                }
              }}
              title={query || activeFilterCount > 0 ? 'No matches found' : 'No SMS records yet'}
              tone="primary"
            />
          )
        }
        renderSectionHeader={({ section }) => (
          <View style={{ paddingTop: Spacing.sm }}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 24).duration(220)} layout={Layout.springify()} style={styles.panel}>
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', flex: 1, minWidth: 0, alignItems: 'center', paddingRight: Spacing.md }}>
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: colors.primaryBg,
                    borderRadius: 18,
                    height: 36,
                    justifyContent: 'center',
                    marginRight: Spacing.md,
                    width: 36,
                  }}
                >
                  <MaterialCommunityIcons
                    name={item.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.value} numberOfLines={1}>{item.description || formatCategory(item.category)}</Text>
                  <Text style={styles.muted} numberOfLines={1}>
                    {formatCategory(item.category)} - {formatPaymentMethod(item.payment_method)} - {formatDate(item.transaction_date)}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', flexShrink: 0, maxWidth: 126 }}>
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={{ ...styles.value, color: item.type === 'income' ? colors.success : colors.textPrimary }}
                >
                  {item.type === 'income' ? '+' : '-'}
                  {formatMoney(item.amount)}
                </Text>
                <PressableScale accessibilityRole="button" onPress={() => confirmDelete(item.id)} style={{ marginTop: Spacing.sm }}>
                  <Text style={{ ...styles.muted, color: colors.error }}>Delete</Text>
                </PressableScale>
              </View>
            </View>
          </Animated.View>
        )}
      />

      <Modal visible={showFilterModal} animationType="fade" transparent>
        <Pressable style={{ backgroundColor: colors.overlay, flex: 1, justifyContent: 'flex-end' }} onPress={() => setShowFilterModal(false)}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              maxHeight: '82%',
              padding: Spacing.lg,
            }}
          >
            <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.base }}>
              <View style={{ flex: 1, paddingRight: Spacing.md }}>
                <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl }}>
                  Filters
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, marginTop: 2 }}>
                  Narrow SMS records by category, method, source, account, or date.
                </Text>
              </View>
              <PressableScale accessibilityRole="button" accessibilityLabel="Close filters" onPress={() => setShowFilterModal(false)} style={{ padding: Spacing.xs }}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </PressableScale>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.md }}>
              <Text style={[styles.sectionTitle, { fontSize: Typography.fontSize.md }]}>Category</Text>
              <View style={styles.chipRow}>
                {[{ id: 'all', name: 'All categories' }, ...categoryOptions].map((option) => {
                  const active = categoryFilter === option.id;
                  return (
                    <PressableScale key={option.id} onPress={() => setCategoryFilter(option.id)} style={[styles.chip, active && styles.chipActive]}>
                      {'icon' in option && (
                        <MaterialCommunityIcons
                          name={option.icon}
                          size={16}
                          color={active ? colors.textInverse : colors.textSecondary}
                          style={{ marginRight: Spacing.xs }}
                        />
                      )}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.name}</Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={[styles.sectionTitle, { fontSize: Typography.fontSize.md }]}>Payment Method</Text>
              <View style={styles.chipRow}>
                {[{ id: 'all', name: 'All methods', icon: 'swap-horizontal' }, ...PAYMENT_METHODS].map((option) => {
                  const active = paymentFilter === option.id;
                  return (
                    <PressableScale key={option.id} onPress={() => setPaymentFilter(option.id)} style={[styles.chip, active && styles.chipActive]}>
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={16}
                        color={active ? colors.textInverse : colors.textSecondary}
                        style={{ marginRight: Spacing.xs }}
                      />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.name}</Text>
                    </PressableScale>
                  );
                })}
              </View>

              {sourceOptions.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { fontSize: Typography.fontSize.md }]}>Capture Source</Text>
                  <View style={styles.chipRow}>
                    {[{ id: 'all', label: 'All sources', icon: 'source-branch' }, ...sourceOptions].map((option) => {
                      const active = sourceFilter === option.id;
                      return (
                        <PressableScale key={option.id} onPress={() => setSourceFilter(option.id)} style={[styles.chip, active && styles.chipActive]}>
                          <MaterialCommunityIcons
                            name={option.icon}
                            size={16}
                            color={active ? colors.textInverse : colors.textSecondary}
                            style={{ marginRight: Spacing.xs }}
                          />
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                        </PressableScale>
                      );
                    })}
                  </View>
                </>
              )}

              {accountOptions.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { fontSize: Typography.fontSize.md }]}>Bank Account</Text>
                  <View style={styles.chipRow}>
                    {[{ id: 'all', name: 'All accounts' }, ...accountOptions].map((option) => {
                      const active = accountFilter === option.id;
                      return (
                        <PressableScale key={option.id} onPress={() => setAccountFilter(option.id)} style={[styles.chip, active && styles.chipActive]}>
                          <MaterialCommunityIcons
                            name={option.id === 'all' ? 'bank-outline' : 'credit-card-check-outline'}
                            size={16}
                            color={active ? colors.textInverse : colors.textSecondary}
                            style={{ marginRight: Spacing.xs }}
                          />
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.name}</Text>
                        </PressableScale>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={[styles.sectionTitle, { fontSize: Typography.fontSize.md }]}>Date Range</Text>
              <View style={styles.chipRow}>
                {DATE_FILTER_OPTIONS.map((option) => {
                  const active = dateFilter === option.id;
                  return (
                    <PressableScale key={option.id} onPress={() => setDateFilter(option.id)} style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                    </PressableScale>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                <Button title="Reset" onPress={resetFilters} variant="outline" icon="refresh" style={{ flex: 1 }} />
                <Button title="Done" onPress={() => setShowFilterModal(false)} icon="check" style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showSortModal} animationType="fade" transparent>
        <Pressable style={{ backgroundColor: colors.overlay, flex: 1, justifyContent: 'flex-end' }} onPress={() => setShowSortModal(false)}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              padding: Spacing.lg,
            }}
          >
            <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.base }}>
              <View>
                <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl }}>
                  Sort
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: 2 }}>
                  Choose how records are ordered.
                </Text>
              </View>
              <PressableScale accessibilityRole="button" accessibilityLabel="Close sort" onPress={() => setShowSortModal(false)} style={{ padding: Spacing.xs }}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </PressableScale>
            </View>

            <View style={{ gap: Spacing.sm }}>
              {SORT_OPTIONS.map((option) => {
                const active = sortOption === option.id;
                return (
                  <PressableScale
                    key={option.id}
                    onPress={() => {
                      setSortOption(option.id);
                      setShowSortModal(false);
                    }}
                    style={{
                      alignItems: 'center',
                      backgroundColor: active ? colors.primaryBg : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                      borderRadius: BorderRadius.md,
                      borderWidth: 1,
                      flexDirection: 'row',
                      gap: Spacing.sm,
                      minHeight: 48,
                      paddingHorizontal: Spacing.md,
                    }}
                  >
                    <MaterialCommunityIcons name={option.icon} size={18} color={active ? colors.primary : colors.textSecondary} />
                    <Text style={{ color: active ? colors.primary : colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>
                      {option.label}
                    </Text>
                    {active && <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />}
                  </PressableScale>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
