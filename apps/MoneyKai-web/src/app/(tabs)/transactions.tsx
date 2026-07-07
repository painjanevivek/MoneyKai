import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, TextInput, Platform, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ExpoDateTimePicker from '@expo/ui/community/datetime-picker';
import { endOfDay, endOfWeek, isWithinInterval, startOfDay, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { WorkspaceHeader } from '@/components/ui/WorkspaceHeader';
import { getCategoryById, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatRelativeDate } from '@/utils/dateUtils';
import { confirmDestructive } from '@/utils/confirmDestructive';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import type { Transaction, TransactionCaptureSource } from '@/types/transaction';

const FILTER_TABS = ['All', 'Expense', 'Income'] as const;
const ALL_CATEGORY_OPTIONS = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
const sanitizeAmount = (value: string) => value.replace(/[^0-9]/g, '');
const getTodayDate = () => formatDate(new Date(), 'yyyy-MM-dd');
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
const CAPTURE_SOURCE_OPTIONS: { id: TransactionCaptureSource; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: 'aa', label: 'Account Aggregator', icon: 'bank-transfer' },
  { id: 'notification', label: 'Notification', icon: 'bell-badge-outline' },
  { id: 'sms', label: 'SMS', icon: 'message-processing-outline' },
  { id: 'gmail', label: 'Gmail', icon: 'gmail' },
  { id: 'pdf', label: 'PDF', icon: 'file-pdf-box' },
  { id: 'portfolio', label: 'Portfolio', icon: 'briefcase-outline' },
  { id: 'manual', label: 'Manual', icon: 'pencil-outline' },
];
type DateFilterOption = typeof DATE_FILTER_OPTIONS[number]['id'];
type SortOption = typeof SORT_OPTIONS[number]['id'];
type FilterValue = 'all' | string;

const getCaptureSourceLabel = (source?: TransactionCaptureSource) =>
  CAPTURE_SOURCE_OPTIONS.find((option) => option.id === source)?.label;

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id ?? 'local');
  const { addTransaction, updateTransaction, deleteTransaction, setFilter } = useTransactionStore();
  const allTransactions = useTransactionStore((s) => s.transactions);
  const filteredTransactions = useTransactionStore((s) => s.getFilteredTransactions());
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const totalIncome = useTransactionStore((s) => s.getTotalIncome());
  const [activeTab, setActiveTab] = useState<typeof FILTER_TABS[number]>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FilterValue>('all');
  const [paymentFilter, setPaymentFilter] = useState<FilterValue>('all');
  const [accountFilter, setAccountFilter] = useState<FilterValue>('all');
  const [sourceFilter, setSourceFilter] = useState<FilterValue>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const [txnType, setTxnType] = useState<'expense' | 'income'>('expense');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnCategory, setTxnCategory] = useState('');
  const [txnDescription, setTxnDescription] = useState('');
  const [txnPayment, setTxnPayment] = useState('upi');
  const [txnDate, setTxnDate] = useState(getTodayDate());
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);
  const isEditing = editingTransaction !== null;

  const resetForm = () => {
    setTxnAmount('');
    setTxnCategory('');
    setTxnDescription('');
    setTxnPayment('upi');
    setTxnType('expense');
    setTxnDate(getTodayDate());
    setShowMobileDatePicker(false);
  };

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

  const handleAmountChange = (value: string) => {
    setTxnAmount(sanitizeAmount(value));
  };

  const populateForm = (transaction: Transaction) => {
    setTxnType(transaction.type);
    setTxnAmount(String(transaction.amount));
    setTxnCategory(transaction.category);
    setTxnDescription(transaction.description);
    setTxnPayment(transaction.payment_method);
    setTxnDate(transaction.transaction_date);
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    populateForm(transaction);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingTransaction(null);
    resetForm();
  };

  const handleDateChange = (value: string) => {
    setTxnDate(value);
  };

  const handleSubmitTransaction = () => {
    const amount = Number(txnAmount);
    const isValidAmount = /^\d+$/.test(txnAmount) && Number.isFinite(amount) && amount > 0;
    const parsedDate = parseTransactionDate(txnDate);
    const isValidDate =
      /^\d{4}-\d{2}-\d{2}$/.test(txnDate) &&
      Number.isFinite(parsedDate.getTime()) &&
      parsedDate.getTime() <= parseTransactionDate(getTodayDate()).getTime();

    if (!isValidAmount || !txnCategory || !txnDescription || !isValidDate) {
      Alert.alert('Missing Fields', 'Please fill in all required fields with a valid transaction date.');
      return;
    }

    const transactionPayload = {
      user_id: editingTransaction?.user_id ?? userId,
      type: txnType,
      amount,
      category: txnCategory,
      description: txnDescription,
      payment_method: txnPayment,
      transaction_date: txnDate,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionPayload);
    } else {
      addTransaction(transactionPayload);
    }

    handleCloseModal();
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

  const categories = txnType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const categoryOptions = activeTab === 'Expense'
    ? EXPENSE_CATEGORIES
    : activeTab === 'Income'
      ? INCOME_CATEGORIES
      : ALL_CATEGORY_OPTIONS;
  const accountOptions = useMemo(() => {
    const options = new Map<string, string>();
    allTransactions.forEach((transaction) => {
      if (transaction.captureAccountId) {
        options.set(
          transaction.captureAccountId,
          transaction.captureAccountLabel ?? transaction.captureBankLabel ?? transaction.captureAccountId
        );
      }
    });
    return Array.from(options.entries()).map(([id, name]) => ({ id, name }));
  }, [allTransactions]);
  const sourceOptions = useMemo(() => {
    const availableSources = new Set(allTransactions.map((transaction) => transaction.captureSource).filter(Boolean));
    return CAPTURE_SOURCE_OPTIONS.filter((option) => availableSources.has(option.id));
  }, [allTransactions]);
  const activeFilterCount =
    Number(categoryFilter !== 'all') +
    Number(paymentFilter !== 'all') +
    Number(accountFilter !== 'all') +
    Number(sourceFilter !== 'all') +
    Number(dateFilter !== 'all');
  const sortLabel = SORT_OPTIONS.find((option) => option.id === sortOption)?.label ?? 'Newest First';
  const netFlow = totalIncome - totalSpent;

  const displayTransactions = useMemo(() => {
    const now = new Date();
    let nextTransactions = [...filteredTransactions];

    if (categoryFilter !== 'all') {
      nextTransactions = nextTransactions.filter((transaction) => transaction.category === categoryFilter);
    }

    if (paymentFilter !== 'all') {
      nextTransactions = nextTransactions.filter((transaction) => transaction.payment_method === paymentFilter);
    }

    if (accountFilter !== 'all') {
      nextTransactions = nextTransactions.filter((transaction) => transaction.captureAccountId === accountFilter);
    }

    if (sourceFilter !== 'all') {
      nextTransactions = nextTransactions.filter((transaction) => transaction.captureSource === sourceFilter);
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
  }, [accountFilter, categoryFilter, dateFilter, filteredTransactions, paymentFilter, sortOption, sourceFilter]);

  const resetAdvancedFilters = () => {
    setCategoryFilter('all');
    setPaymentFilter('all');
    setAccountFilter('all');
    setSourceFilter('all');
    setDateFilter('all');
  };

  const renderTransaction = ({ item: txn }: { item: Transaction }) => {
    const category = getCategoryById(txn.category);
    const isExpense = txn.type === 'expense';
    const captureSourceLabel = getCaptureSourceLabel(txn.captureSource);

    return (
      <TouchableOpacity
        onPress={() => handleOpenEditModal(txn)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
          paddingVertical: Spacing.md,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: BorderRadius.sm,
            backgroundColor: category?.colorLight || colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: Spacing.md,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <MaterialCommunityIcons name={(category?.icon || 'help-circle-outline') as any} size={22} color={category?.color || '#6B7280'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>{txn.description}</Text>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: colors.textTertiary }}>
            {category?.name} • {formatRelativeDate(txn.transaction_date)} • {PAYMENT_METHODS.find((p) => p.id === txn.payment_method)?.name || txn.payment_method}
          </Text>
          {(txn.captureAccountLabel || captureSourceLabel) ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {txn.captureAccountLabel ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, backgroundColor: colors.primaryBg }}>
                  <MaterialCommunityIcons name="bank-outline" size={12} color={colors.primary} />
                  <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.medium, color: colors.primary }}>
                    {txn.captureAccountLabel}
                  </Text>
                </View>
              ) : null}
              {captureSourceLabel ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderLight }}>
                  <MaterialCommunityIcons name="source-branch" size={12} color={colors.textSecondary} />
                  <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                    {captureSourceLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
        <Text
          style={{
            fontSize: Typography.fontSize.md,
            fontFamily: Typography.fontFamily.semiBold,
            color: isExpense ? colors.emergency : colors.primaryLight,
            marginLeft: Spacing.md,
            minWidth: 108,
            textAlign: 'right',
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
              borderColor: colors.borderLight,
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
              borderColor: `${colors.emergency}38`,
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
      <ScrollView
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['4xl'] }}
      >
        <View style={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.base }}>
          <WorkspaceHeader
            icon="swap-horizontal"
            eyebrow="TRANSACTION LEDGER"
            title="Reviewed money movement"
            description="Search, filter, edit, and approve the records shaping MoneyKai reports and budget decisions."
            metrics={[
              { label: 'Visible records', value: String(displayTransactions.length) },
              { label: 'Spent', value: formatCurrency(totalSpent), tone: 'danger' },
              { label: 'Income', value: formatCurrency(totalIncome), tone: 'positive' },
              { label: 'Net flow', value: `${netFlow < 0 ? '-' : '+'}${formatCurrency(Math.abs(netFlow))}`, tone: netFlow < 0 ? 'danger' : 'positive' },
            ]}
            chips={[
              { icon: 'filter-variant', label: `${activeFilterCount} active filters` },
              { icon: 'sort', label: sortLabel },
            ]}
            actions={<Button title="Add Transaction" icon="plus" onPress={handleOpenAddModal} variant="outline" />}
          />
        </View>

        <View
          style={{
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
            paddingHorizontal: Spacing.base,
            paddingTop: Spacing.sm,
            paddingBottom: Spacing.md,
            zIndex: 10,
          }}
        >
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

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', flex: 1 }}>
              {FILTER_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => handleTabChange(tab)}
                  style={{
                    paddingHorizontal: Spacing.base,
                    paddingVertical: Spacing.sm,
                    borderRadius: BorderRadius.full,
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
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity
                onPress={() => setShowFilterModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
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
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                  {sortLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.md }}>
          {displayTransactions.length > 0 ? (
            displayTransactions.map((transaction) => (
              <React.Fragment key={transaction.id}>
                {renderTransaction({ item: transaction })}
              </React.Fragment>
            ))
          ) : (
            <EmptyState icon="receipt" title="No Transactions" message="Start tracking by adding your first transaction." />
          )}
        </View>
      </ScrollView>

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
                  Narrow transactions by category, linked account, source, payment method, and date.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={true}>
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
                Bank Account
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base }}>
                {[{ id: 'all', name: 'All Accounts' }, ...accountOptions].map((option) => {
                  const active = accountFilter === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setAccountFilter(option.id)}
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
                      <MaterialCommunityIcons name="bank-outline" size={16} color={active ? colors.primary : colors.textTertiary} />
                      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: active ? colors.primary : colors.textSecondary }}>
                        {option.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
                Capture Source
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base }}>
                {[{ id: 'all' as const, label: 'All Sources', icon: 'source-branch' as const }, ...sourceOptions].map((option) => {
                  const active = sourceFilter === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setSourceFilter(option.id)}
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

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              padding: Spacing.xl,
              maxHeight: '85%',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                {isEditing ? 'Edit Transaction' : 'Add Transaction'}
              </Text>
              <TouchableOpacity
                onPress={handleCloseModal}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={true}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base }}>
                {(['expense', 'income'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => {
                      setTxnType(type);
                      setTxnCategory('');
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: Spacing.sm,
                      borderRadius: BorderRadius.md,
                      alignItems: 'center',
                      backgroundColor: txnType === type ? (type === 'expense' ? colors.emergencyBg : colors.primaryBg) : colors.surface,
                      borderWidth: txnType === type ? 2 : 1,
                      borderColor: txnType === type ? (type === 'expense' ? colors.emergency : colors.primary) : colors.border,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={type === 'expense' ? 'arrow-up-circle' : 'arrow-down-circle'}
                      size={20}
                      color={txnType === type ? (type === 'expense' ? colors.emergency : colors.primary) : colors.textTertiary}
                    />
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        fontFamily: Typography.fontFamily.semiBold,
                        color: txnType === type ? (type === 'expense' ? colors.emergency : colors.primary) : colors.textSecondary,
                        marginTop: 4,
                        textTransform: 'capitalize',
                      }}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Amount"
                placeholder="0"
                value={txnAmount}
                onChangeText={handleAmountChange}
                prefix="₹"
                keyboardType="number-pad"
                inputMode="numeric"
                icon="cash"
              />
              <Input label="Description" placeholder="What was this for?" value={txnDescription} onChangeText={setTxnDescription} icon="text-short" />

              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary, marginBottom: Spacing.xs }}>
                Transaction Date
              </Text>
              {Platform.OS === 'web' ? (
                <View
                  style={{
                    marginBottom: Spacing.base,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: BorderRadius.md,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    paddingHorizontal: Spacing.md,
                    minHeight: 48,
                  }}
                >
                  <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.textTertiary} style={{ marginRight: Spacing.sm }} />
                  <input
                    type="date"
                    value={txnDate}
                    max={getTodayDate()}
                    onChange={(event) => handleDateChange(event.currentTarget.value)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: colors.textPrimary,
                      fontSize: Typography.fontSize.base,
                      fontFamily: Typography.fontFamily.regular,
                      padding: '12px 0',
                    }}
                  />
                </View>
              ) : (
                <View style={{ marginBottom: Spacing.base }}>
                  <TouchableOpacity
                    onPress={() => setShowMobileDatePicker((current) => !current)}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: colors.surface,
                      borderRadius: BorderRadius.md,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      paddingHorizontal: Spacing.md,
                      minHeight: 48,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.textTertiary} style={{ marginRight: Spacing.sm }} />
                      <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular, color: colors.textPrimary }}>
                        {formatDate(txnDate, 'dd MMM yyyy')}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name={showMobileDatePicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {Platform.OS === 'ios' && showMobileDatePicker ? (
                    <View
                      style={{
                        marginTop: Spacing.sm,
                        borderRadius: BorderRadius.md,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.card,
                        padding: Spacing.sm,
                      }}
                    >
                      <ExpoDateTimePicker
                        value={parseTransactionDate(txnDate)}
                        mode="date"
                        display="inline"
                        maximumDate={new Date()}
                        onValueChange={(_, date) => {
                          handleDateChange(formatDate(date, 'yyyy-MM-dd'));
                        }}
                      />
                      <Button
                        title="Done"
                        onPress={() => setShowMobileDatePicker(false)}
                        variant="secondary"
                        size="sm"
                        icon="check"
                        style={{ marginTop: Spacing.sm, alignSelf: 'flex-end' }}
                      />
                    </View>
                  ) : null}
                  {Platform.OS === 'android' && showMobileDatePicker ? (
                    <ExpoDateTimePicker
                      value={parseTransactionDate(txnDate)}
                      mode="date"
                      presentation="dialog"
                      maximumDate={new Date()}
                      onDismiss={() => setShowMobileDatePicker(false)}
                      onValueChange={(_, date) => {
                        handleDateChange(formatDate(date, 'yyyy-MM-dd'));
                        setShowMobileDatePicker(false);
                      }}
                    />
                  ) : null}
                </View>
              )}

              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary, marginBottom: Spacing.sm }}>Category</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base }}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setTxnCategory(cat.id)}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      borderRadius: BorderRadius.full,
                      backgroundColor: txnCategory === cat.id ? `${cat.color}15` : colors.surface,
                      borderWidth: 1.5,
                      borderColor: txnCategory === cat.id ? cat.color : colors.border,
                    }}
                  >
                    <MaterialCommunityIcons name={cat.icon as any} size={16} color={txnCategory === cat.id ? cat.color : colors.textTertiary} />
                    <Text
                      style={{
                        fontSize: Typography.fontSize.xs,
                        fontFamily: Typography.fontFamily.medium,
                        color: txnCategory === cat.id ? cat.color : colors.textSecondary,
                      }}
                    >
                      {cat.name.split(' ')[0]}
                    </Text>
                    {(cat.id === 'others' || cat.id === 'other_income') && txnCategory === cat.id && (
                      <View
                        style={{
                          marginLeft: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: BorderRadius.full,
                          backgroundColor: colors.surface,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: Typography.fontFamily.medium,
                            color: colors.textTertiary,
                          }}
                        >
                          custom
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary, marginBottom: Spacing.sm }}>Payment Method</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
                {PAYMENT_METHODS.map((pm) => (
                  <TouchableOpacity
                    key={pm.id}
                    onPress={() => setTxnPayment(pm.id)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: Spacing.sm,
                      borderRadius: BorderRadius.md,
                      backgroundColor: txnPayment === pm.id ? colors.primaryBg : colors.surface,
                      borderWidth: 1.5,
                      borderColor: txnPayment === pm.id ? colors.primary : colors.border,
                    }}
                  >
                    <MaterialCommunityIcons name={pm.icon as any} size={18} color={txnPayment === pm.id ? colors.primary : colors.textTertiary} />
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: Typography.fontFamily.medium,
                        marginTop: 2,
                        color: txnPayment === pm.id ? colors.primary : colors.textSecondary,
                      }}
                    >
                      {pm.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {isEditing ? (
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <Button
                    title="Delete"
                    onPress={() => {
                      if (!editingTransaction) return;
                      handleDelete(editingTransaction.id, handleCloseModal);
                    }}
                    variant="danger"
                    size="lg"
                    icon="trash-can-outline"
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Save Changes"
                    onPress={handleSubmitTransaction}
                    fullWidth
                    size="lg"
                    icon="content-save-outline"
                    style={{ flex: 1 }}
                  />
                </View>
              ) : (
                <Button title="Add Transaction" onPress={handleSubmitTransaction} fullWidth size="lg" icon="check" />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
