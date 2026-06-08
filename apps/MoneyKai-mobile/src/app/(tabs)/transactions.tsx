import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Modal, Alert, TextInput, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import ExpoDateTimePicker from '@expo/ui/community/datetime-picker';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCategoryById, EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatRelativeDate } from '@/utils/dateUtils';
import { confirmDestructive } from '@/utils/confirmDestructive';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import type { Transaction } from '@/types/transaction';

const FILTER_TABS = ['All', 'Expense', 'Income'] as const;
const sanitizeAmount = (value: string) => value.replace(/[^0-9]/g, '');
const getTodayDate = () => formatDate(new Date(), 'yyyy-MM-dd');
const parseTransactionDate = (value: string) => new Date(`${value}T12:00:00`);

export default function TransactionsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id ?? 'local');
  const { addTransaction, updateTransaction, deleteTransaction, setFilter } = useTransactionStore();
  const filteredTransactions = useTransactionStore((s) => s.getFilteredTransactions());
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const totalIncome = useTransactionStore((s) => s.getTotalIncome());
  const [activeTab, setActiveTab] = useState<typeof FILTER_TABS[number]>('All');
  const composeParam = useLocalSearchParams<{ compose?: string }>().compose;
  const shouldOpenComposer = composeParam === '1' || composeParam === 'true';
  const [showAddModal, setShowAddModal] = useState(shouldOpenComposer);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilter({ searchQuery: query });
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

  const handleCloseAddModal = () => {
    const shouldReturnToPreviousScreen = shouldOpenComposer && !editingTransaction;
    setShowAddModal(false);
    setEditingTransaction(null);
    resetForm();
    if (shouldReturnToPreviousScreen) {
      router.back();
    }
  };

  const handleAmountChange = (value: string) => {
    setTxnAmount(sanitizeAmount(value));
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

    handleCloseAddModal();
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

      <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.md }}>
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

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 160 }}
        ListEmptyComponent={<EmptyState icon="receipt" title="No Transactions" message="Start tracking by adding your first transaction." />}
      />

      <TouchableOpacity
        onPress={handleOpenAddModal}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 96,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...Shadows.lg,
          shadowColor: colors.primary,
        }}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.textInverse} />
      </TouchableOpacity>

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
                onPress={handleCloseAddModal}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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
                icon="currency-inr"
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
                      handleDelete(editingTransaction.id, handleCloseAddModal);
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

