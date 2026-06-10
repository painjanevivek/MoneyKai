import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SectionList, Modal, TextInput, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { endOfDay, endOfWeek, format, isWithinInterval, startOfDay, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TransactionComposerSheet } from '@/components/ui/TransactionComposerSheet';
import { getCategoryById, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatRelativeDate } from '@/utils/dateUtils';
import { confirmDestructive } from '@/utils/confirmDestructive';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import type { Transaction } from '@/types/transaction';

const FILTER_TABS = ['All', 'Expense', 'Income'] as const;
const ALL_CATEGORY_OPTIONS = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
const parseTransactionDate = (value: string) => new Date(`${value}T12:00:00`);
const DATE_FILTER_OPTIONS = [
  { id: 'all', label: 'All Dates' },
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_30_days', label: 'Last 30 Days' },
] as const;
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First', icon: 'calendar-arrow-down' },
  { id: 'oldest', label: 'Oldest First', icon: 'calendar-arrow-up' },
  { id: 'amount_high', label: 'Amount High to Low', icon: 'sort-numeric-descending' },
  { id: 'amount_low', label: 'Amount Low to High', icon: 'sort-numeric-ascending' },
  { id: 'name_az', label: 'Name A to Z', icon: 'sort-alphabetical-ascending' },
  { id: 'name_za', label: 'Name Z to A', icon: 'sort-alphabetical-descending' },
] as const;
type DateFilterOption = typeof DATE_FILTER_OPTIONS[number]['id'];
type SortOption = typeof SORT_OPTIONS[number]['id'];
type FilterValue = 'all' | string;
type TransactionMonthSection = {
  title: string;
  data: Transaction[];
};

export default function TransactionsScreen() {
  const { colors, isDark } = useTheme();
  const { deleteTransaction, setFilter } = useTransactionStore();
  const filteredTransactions = useTransactionStore((s) => s.getFilteredTransactions());
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const totalIncome = useTransactionStore((s) => s.getTotalIncome());
  const [activeTab, setActiveTab] = useState<typeof FILTER_TABS[number]>('All');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FilterValue>('all');
  const [paymentFilter, setPaymentFilter] = useState<FilterValue>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const handleTabChange = (tab: typeof FILTER_TABS[number]) => {
    setActiveTab(tab);
    setFilter({
      type: tab === 'All' ? undefined : tab === 'Expense' ? 'expense' : 'income',
    });

    if (tab === 'Expense' && categoryFilter !== 'all' && !EXPENSE_CATEGORIES.some((category) => category.id === categoryFilter)) {
      setCategoryFilter('all');
    }

    if (tab === 'Income' && categoryFilter !== 'all' && !INCOME_CATEGORIES.some((category) => category.id === categoryFilter)) {
      setCategoryFilter('all');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilter({ searchQuery: query });
  };

  const handleOpenEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleDelete = (id: string, onAfterDelete?: () => void) => {
    confirmDestructive({
      title: 'Delete Transaction',
      message: 'Remove this transaction from your history? This cannot be undone.',
      onConfirm: () => {
        deleteTransaction(id);
        onAfterDelete?.();
      },
    });
  };

  const categoryOptions = activeTab === 'Expense'
    ? EXPENSE_CATEGORIES
    : activeTab === 'Income'
      ? INCOME_CATEGORIES
      : ALL_CATEGORY_OPTIONS;
  const activeFilterCount = Number(categoryFilter !== 'all') + Number(paymentFilter !== 'all') + Number(dateFilter !== 'all');
  const sortLabel = SORT_OPTIONS.find((option) => option.id === sortOption)?.label ?? 'Newest First';

  const displayTransactions = useMemo(() => {
    const now = new Date();
    let nextTransactions = [...filteredTransactions];

    if (categoryFilter !== 'all') {
      nextTransactions = nextTransactions.filter((transaction) => transaction.category === categoryFilter);
    }

    if (paymentFilter !== 'all') {
      nextTransactions = nextTransactions.filter((transaction) => transaction.payment_method === paymentFilter);
    }

    if (dateFilter !== 'all') {
      nextTransactions = nextTransactions.filter((transaction) => {
        const transactionDate = parseTransactionDate(transaction.transaction_date);

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
      });
    }

    switch (sortOption) {
      case 'oldest':
        return nextTransactions.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());
      case 'amount_high':
        return nextTransactions.sort((a, b) => b.amount - a.amount);
      case 'amount_low':
        return nextTransactions.sort((a, b) => a.amount - b.amount);
      case 'name_az':
        return nextTransactions.sort((a, b) => a.description.localeCompare(b.description));
      case 'name_za':
        return nextTransactions.sort((a, b) => b.description.localeCompare(a.description));
      case 'newest':
      default:
        return nextTransactions.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    }
  }, [categoryFilter, dateFilter, filteredTransactions, paymentFilter, sortOption]);

  const transactionSections = useMemo<TransactionMonthSection[]>(() => {
    const sections = new Map<string, TransactionMonthSection>();

    displayTransactions.forEach((transaction) => {
      const sectionTitle = format(parseTransactionDate(transaction.transaction_date), 'MMMM yyyy');
      const existingSection = sections.get(sectionTitle);

      if (existingSection) {
        existingSection.data.push(transaction);
        return;
      }

      sections.set(sectionTitle, {
        title: sectionTitle,
        data: [transaction],
      });
    });

    return Array.from(sections.values());
  }, [displayTransactions]);

  const resetAdvancedFilters = () => {
    setCategoryFilter('all');
    setPaymentFilter('all');
    setDateFilter('all');
  };

  const renderTransaction = ({ item: txn }: { item: Transaction }) => {
    const category = getCategoryById(txn.category);
    const isExpense = txn.type === 'expense';

    return (
      <TouchableOpacity
        onPress={() => handleOpenEditModal(txn)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.card,
          borderRadius: BorderRadius.md,
          padding: Spacing.md,
          marginBottom: Spacing.sm,
          ...Shadows.sm,
          shadowColor: colors.shadowColor,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: BorderRadius.sm,
            backgroundColor: category?.colorLight || '#F3F4F6',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: Spacing.md,
          }}
        >
          <MaterialCommunityIcons name={(category?.icon || 'help-circle-outline') as any} size={22} color={category?.color || '#6B7280'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>{txn.description}</Text>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: colors.textTertiary }}>
            {category?.name} • {formatRelativeDate(txn.transaction_date)} • {PAYMENT_METHODS.find((p) => p.id === txn.payment_method)?.name || txn.payment_method}
          </Text>
        </View>
        <Text
          style={{
            fontSize: Typography.fontSize.md,
            fontFamily: Typography.fontFamily.semiBold,
            color: isExpense ? colors.emergency : colors.primaryLight,
            marginLeft: Spacing.md,
          }}
        >
          {isExpense ? '-' : '+'}{formatCurrency(txn.amount)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginLeft: Spacing.md }}>
          <TouchableOpacity
            onPress={() => handleOpenEditModal(txn)}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: BorderRadius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(txn.id)}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: BorderRadius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.emergencyBg,
              borderWidth: 1,
              borderColor: colors.emergency,
            }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.emergency} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>Transactions</Text>
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary }}>Manage your income and expenses</Text>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.md }}>
        <View
          style={{
            flex: 1,
            backgroundColor: isDark ? colors.surface : '#F5F5F5',
            borderRadius: BorderRadius.md,
            padding: Spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>Total Spent</Text>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>{formatCurrency(totalSpent)}</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: BorderRadius.md,
            padding: Spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>Total Income</Text>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>{formatCurrency(totalIncome)}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: BorderRadius.md,
            paddingHorizontal: Spacing.md,
            height: 44,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            style={{ flex: 1, marginLeft: 8, fontSize: Typography.fontSize.base, color: colors.textPrimary, fontFamily: Typography.fontFamily.regular }}
          />
        </View>
      </View>

      <View style={{ paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.md }}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabChange(tab)}
              style={{
                minWidth: tab === 'All' ? 72 : 104,
                minHeight: 44,
                paddingHorizontal: Spacing.base,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: activeTab === tab ? colors.primary : colors.card,
                borderWidth: activeTab === tab ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontFamily: Typography.fontFamily.medium,
                  color: activeTab === tab ? colors.textInverse : colors.textSecondary,
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.sm }}>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: 44,
              gap: 6,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.full,
              backgroundColor: activeFilterCount > 0 ? colors.primaryBg : colors.card,
              borderWidth: 1,
              borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
            }}
          >
            <MaterialCommunityIcons name="filter-variant" size={16} color={activeFilterCount > 0 ? colors.primary : colors.textSecondary} />
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: activeFilterCount > 0 ? colors.primary : colors.textSecondary }}>
              {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSortModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: 44,
              gap: 6,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.full,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons name="sort" size={16} color={colors.textSecondary} />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.84}
              style={{ maxWidth: 168, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}
            >
              {sortLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <SectionList
        sections={transactionSections}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={{ backgroundColor: colors.background, paddingTop: Spacing.sm, paddingBottom: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
              {section.title}
            </Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'] }}
        ListEmptyComponent={<EmptyState icon="receipt" title="No Transactions" message="Start tracking by adding your first transaction." />}
      />

      <Modal visible={showFilterModal} animationType="fade" transparent>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }} onPress={() => setShowFilterModal(false)}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              padding: Spacing.xl,
              maxHeight: '80%',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <View>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>Filters</Text>
                <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                  Narrow transactions by category, payment method, and date.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
                Category
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base }}>
                {[{ id: 'all', name: 'All Categories' }, ...categoryOptions].map((option) => {
                  const active = categoryFilter === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setCategoryFilter(option.id)}
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
                      {'icon' in option ? <MaterialCommunityIcons name={option.icon as any} size={16} color={active ? colors.primary : colors.textTertiary} /> : null}
                      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: active ? colors.primary : colors.textSecondary }}>
                        {option.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
                Payment Method
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base }}>
                {[{ id: 'all', name: 'All Methods', icon: 'swap-horizontal' }, ...PAYMENT_METHODS].map((option) => {
                  const active = paymentFilter === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setPaymentFilter(option.id)}
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
                        {option.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
                Date Range
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl }}>
                {DATE_FILTER_OPTIONS.map((option) => {
                  const active = dateFilter === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setDateFilter(option.id)}
                      style={{
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.sm,
                        borderRadius: BorderRadius.full,
                        backgroundColor: active ? colors.primaryBg : colors.surface,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: active ? colors.primary : colors.textSecondary }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Button
                  title="Reset Filters"
                  onPress={resetAdvancedFilters}
                  variant="outline"
                  size="lg"
                  icon="refresh"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Done"
                  onPress={() => setShowFilterModal(false)}
                  size="lg"
                  icon="check"
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showSortModal} animationType="fade" transparent>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }} onPress={() => setShowSortModal(false)}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              padding: Spacing.xl,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <View>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>Sort</Text>
                <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                  Choose how transactions should be ordered.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: Spacing.sm }}>
              {SORT_OPTIONS.map((option) => {
                const active = sortOption === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => {
                      setSortOption(option.id);
                      setShowSortModal(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: Spacing.sm,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.md,
                      borderRadius: BorderRadius.md,
                      backgroundColor: active ? colors.primaryBg : colors.surface,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 }}>
                      <MaterialCommunityIcons name={option.icon as any} size={18} color={active ? colors.primary : colors.textSecondary} />
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: active ? colors.primary : colors.textPrimary }}>
                        {option.label}
                      </Text>
                    </View>
                    {active ? <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {editingTransaction ? (
        <TransactionComposerSheet
          visible
          editingTransaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

