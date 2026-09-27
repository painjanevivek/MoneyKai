import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, getCategoryById } from '@/constants/categories';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import type { Transaction, TransactionType } from '@/types/transaction';
import { titleCase } from '@/utils/labels';
import { Button } from './Button';
import { Input } from './Input';
import { ModalSheet } from './ModalSheet';
import { PressableScale } from './PressableScale';

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  onClose: () => void;
  onDeleted?: () => void;
}

function parseTransactionDate(value: string) {
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date();
}

function toDateInput(value: string) {
  return parseTransactionDate(value).toISOString().slice(0, 10);
}

export function TransactionDetailSheet({ transaction, onClose, onDeleted }: TransactionDetailSheetProps) {
  const { colors } = useTheme();
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const [isEditing, setIsEditing] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0].id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!transaction) return;
    setIsEditing(false);
    setType(transaction.type);
    setAmount(String(transaction.amount));
    setDescription(transaction.description);
    setCategory(transaction.category);
    setPaymentMethod(transaction.payment_method);
    setDate(toDateInput(transaction.transaction_date));
    setShowDatePicker(false);
    setFormError(null);
  }, [transaction]);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const categoryName = transaction
    ? getCategoryById(transaction.category)?.name ?? titleCase(transaction.category)
    : '';
  const paymentMethodName = transaction
    ? PAYMENT_METHODS.find((method) => method.id === transaction.payment_method)?.name ?? titleCase(transaction.payment_method)
    : '';
  const formattedAmount = transaction
    ? `${transaction.type === 'income' ? '+' : '-'}${currencySymbol}${transaction.amount.toLocaleString('en-IN')}`
    : '';
  const transactionDate = transaction ? parseTransactionDate(transaction.transaction_date) : new Date();
  const selectedDate = parseTransactionDate(date);
  const displayDate = selectedDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const metadata = useMemo(() => {
    if (!transaction) return [];
    return [
      { label: 'Type', value: titleCase(transaction.type), icon: transaction.type === 'income' ? 'arrow-down-left' : 'arrow-up-right' },
      { label: 'Category', value: categoryName, icon: getCategoryById(transaction.category)?.icon ?? 'shape-outline' },
      { label: 'Payment method', value: paymentMethodName, icon: 'credit-card-outline' },
      { label: 'Transaction date', value: transactionDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), icon: 'calendar-month-outline' },
      { label: 'Capture source', value: titleCase(transaction.captureSource ?? 'manual'), icon: 'source-branch' },
      transaction.captureAccountLabel || transaction.captureBankLabel
        ? { label: 'Account', value: transaction.captureAccountLabel ?? transaction.captureBankLabel ?? '', icon: 'bank-outline' }
        : null,
      transaction.captureAccountHint
        ? { label: 'Account hint', value: transaction.captureAccountHint, icon: 'identifier' }
        : null,
      transaction.receipt_url
        ? { label: 'Receipt', value: 'Attached', icon: 'receipt-text-check-outline' }
        : null,
      { label: 'Added', value: parseTransactionDate(transaction.created_at).toLocaleString('en-IN'), icon: 'clock-outline' },
      { label: 'Record ID', value: transaction.id, icon: 'fingerprint' },
    ].filter((item): item is { label: string; value: string; icon: string } => Boolean(item));
  }, [categoryName, paymentMethodName, transaction, transactionDate]);

  const selectType = (nextType: TransactionType) => {
    setType(nextType);
    const nextCategories = nextType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!nextCategories.some((item) => item.id === category)) {
      setCategory(nextCategories[0].id);
    }
    setFormError(null);
  };

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selected) {
      setDate(selected.toISOString().slice(0, 10));
      setFormError(null);
    }
  };

  const save = () => {
    if (!transaction) return;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Enter a valid amount greater than zero.');
      return;
    }
    if (!description.trim()) {
      setFormError('Add a description for this transaction.');
      return;
    }

    updateTransaction(transaction.id, {
      type,
      amount: numericAmount,
      description: description.trim(),
      category,
      payment_method: paymentMethod,
      transaction_date: date,
    });
    setFormError(null);
    setIsEditing(false);
  };

  const confirmDelete = () => {
    if (!transaction) return;
    Alert.alert(
      'Delete transaction?',
      'This permanently removes the saved record from this account and Firestore sync.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(transaction.id);
            onDeleted?.();
            onClose();
          },
        },
      ]
    );
  };

  const close = () => {
    setIsEditing(false);
    setShowDatePicker(false);
    setFormError(null);
    onClose();
  };

  return (
    <ModalSheet
      visible={Boolean(transaction)}
      title={isEditing ? 'Edit transaction' : 'Transaction details'}
      subtitle={isEditing ? 'Update the saved record without losing its capture history.' : 'Review the complete saved record.'}
      onClose={close}
      maxHeight={760}
      footer={
        transaction ? (
          <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.sm }}>
            {isEditing ? (
              <>
                <Button title="Cancel" variant="outline" onPress={() => setIsEditing(false)} style={{ flex: 1 }} />
                <Button title="Save changes" icon="check" onPress={save} style={{ flex: 1 }} />
              </>
            ) : (
              <>
                <Button title="Delete" variant="danger" icon="trash-can-outline" onPress={confirmDelete} style={{ flex: 1 }} />
                <Button title="Edit" icon="pencil-outline" onPress={() => setIsEditing(true)} style={{ flex: 1 }} />
              </>
            )}
          </View>
        ) : undefined
      }
    >
      {transaction && !isEditing && (
        <View>
          <View
            style={{
              backgroundColor: colors.primaryBg,
              borderColor: `${colors.primary}22`,
              borderRadius: BorderRadius.md,
              borderWidth: 1,
              marginBottom: Spacing.base,
              padding: Spacing.lg,
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm }}>Amount</Text>
            <Text
              style={{
                color: transaction.type === 'income' ? colors.success : colors.textPrimary,
                fontFamily: Typography.fontFamily.bold,
                fontSize: Typography.fontSize['2xl'],
                marginTop: Spacing.xs,
              }}
            >
              {formattedAmount}
            </Text>
          </View>

          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, marginBottom: Spacing.sm }}>
              Full description
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: Typography.fontSize.base, lineHeight: Typography.lineHeight.base }}>
              {transaction.description || 'No description provided.'}
            </Text>
          </View>

          <View style={{ borderColor: colors.borderLight, borderRadius: BorderRadius.md, borderWidth: 1, overflow: 'hidden' }}>
            {metadata.map((item, index) => (
              <View
                key={item.label}
                style={{
                  alignItems: 'flex-start',
                  borderTopColor: colors.borderLight,
                  borderTopWidth: index === 0 ? 0 : 1,
                  flexDirection: 'row',
                  gap: Spacing.md,
                  padding: Spacing.md,
                }}
              >
                <MaterialCommunityIcons name={item.icon} size={19} color={colors.primary} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>{item.label}</Text>
                  <Text selectable style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, marginTop: 2 }}>
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {transaction && isEditing && (
        <View>
          {formError && (
            <View style={{ backgroundColor: `${colors.error}12`, borderColor: `${colors.error}33`, borderRadius: BorderRadius.sm, borderWidth: 1, marginBottom: Spacing.base, padding: Spacing.md }}>
              <Text style={{ color: colors.error, fontSize: Typography.fontSize.sm }}>{formError}</Text>
            </View>
          )}

          <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, marginBottom: Spacing.sm }}>Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base }}>
            {(['expense', 'income'] as const).map((item) => {
              const active = type === item;
              return (
                <PressableScale
                  key={item}
                  onPress={() => selectType(item)}
                  style={{
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: BorderRadius.full,
                    borderWidth: 1,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                  }}
                >
                  <Text style={{ color: active ? colors.textInverse : colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>{titleCase(item)}</Text>
                </PressableScale>
              );
            })}
          </View>

          <Input label="Amount" value={amount} onChangeText={(value) => { setAmount(value); setFormError(null); }} keyboardType="decimal-pad" inputMode="decimal" prefix={currencySymbol} />
          <Input label="Description" value={description} onChangeText={(value) => { setDescription(value); setFormError(null); }} multiline numberOfLines={4} maxLength={500} />

          <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>Date</Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Choose transaction date"
            onPress={() => setShowDatePicker(true)}
            style={{
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: BorderRadius.md,
              borderWidth: 1.5,
              flexDirection: 'row',
              gap: Spacing.sm,
              marginBottom: Spacing.base,
              marginTop: Spacing.sm,
              minHeight: 52,
              paddingHorizontal: Spacing.md,
            }}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={21} color={colors.primary} />
            <Text style={{ color: colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily.medium }}>{displayDate}</Text>
            <MaterialCommunityIcons name="chevron-down" size={21} color={colors.textTertiary} />
          </PressableScale>
          {showDatePicker && <DateTimePicker value={selectedDate} mode="date" display="calendar" onChange={onDateChange} />}

          <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, marginBottom: Spacing.sm }}>Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base }}>
            {categories.map((item) => {
              const active = category === item.id;
              return (
                <PressableScale
                  key={item.id}
                  onPress={() => setCategory(item.id)}
                  style={{ alignItems: 'center', backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border, borderRadius: BorderRadius.full, borderWidth: 1, flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }}
                >
                  <MaterialCommunityIcons name={item.icon} size={16} color={active ? colors.textInverse : colors.textSecondary} />
                  <Text style={{ color: active ? colors.textInverse : colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>{item.name}</Text>
                </PressableScale>
              );
            })}
          </View>

          <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, marginBottom: Spacing.sm }}>Payment method</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {PAYMENT_METHODS.map((item) => {
              const active = paymentMethod === item.id;
              return (
                <PressableScale
                  key={item.id}
                  onPress={() => setPaymentMethod(item.id)}
                  style={{ alignItems: 'center', backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border, borderRadius: BorderRadius.full, borderWidth: 1, flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }}
                >
                  <MaterialCommunityIcons name={item.icon} size={16} color={active ? colors.textInverse : colors.textSecondary} />
                  <Text style={{ color: active ? colors.textInverse : colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>{item.name}</Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      )}
    </ModalSheet>
  );
}

export default TransactionDetailSheet;
