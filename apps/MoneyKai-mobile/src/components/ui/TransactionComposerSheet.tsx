import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ExpoDateTimePicker from '@expo/ui/community/datetime-picker';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { formatDate } from '@/utils/dateUtils';
import { confirmDestructive } from '@/utils/confirmDestructive';
import type { Transaction } from '@/types/transaction';

type TransactionComposerSheetProps = {
  visible: boolean;
  editingTransaction?: Transaction | null;
  onClose: () => void;
};

const sanitizeAmount = (value: string) => value.replace(/[^0-9]/g, '');
const getTodayDate = () => formatDate(new Date(), 'yyyy-MM-dd');
const parseTransactionDate = (value: string) => new Date(`${value}T12:00:00`);

export function TransactionComposerSheet({
  visible,
  editingTransaction = null,
  onClose,
}: TransactionComposerSheetProps) {
  const { colors } = useTheme();
  const userId = useAuthStore((s) => s.user?.id ?? 'local');
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactionStore();
  const isEditing = editingTransaction !== null;

  const [txnType, setTxnType] = useState<'expense' | 'income'>(editingTransaction?.type ?? 'expense');
  const [txnAmount, setTxnAmount] = useState(editingTransaction ? String(editingTransaction.amount) : '');
  const [txnCategory, setTxnCategory] = useState(editingTransaction?.category ?? '');
  const [txnDescription, setTxnDescription] = useState(editingTransaction?.description ?? '');
  const [txnPayment, setTxnPayment] = useState(editingTransaction?.payment_method ?? 'upi');
  const [txnDate, setTxnDate] = useState(editingTransaction?.transaction_date ?? getTodayDate());
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);

  const handleClose = () => {
    setShowMobileDatePicker(false);
    onClose();
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

    handleClose();
  };

  const handleDelete = () => {
    if (!editingTransaction) {
      return;
    }

    confirmDestructive({
      title: 'Delete Transaction',
      message: 'Remove this transaction from your history? This cannot be undone.',
      onConfirm: () => {
        deleteTransaction(editingTransaction.id);
        handleClose();
      },
    });
  };

  const categories = txnType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
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
            <TouchableOpacity onPress={handleClose}>
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
                        if (date) {
                          handleDateChange(formatDate(date, 'yyyy-MM-dd'));
                        }
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
                      if (date) {
                        handleDateChange(formatDate(date, 'yyyy-MM-dd'));
                      }
                      setShowMobileDatePicker(false);
                    }}
                  />
                ) : null}
              </View>
            )}

            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary, marginBottom: Spacing.sm }}>
              Category
            </Text>
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
                  {(cat.id === 'others' || cat.id === 'other_income') && txnCategory === cat.id ? (
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
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary, marginBottom: Spacing.sm }}>
              Payment Method
            </Text>
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
                  onPress={handleDelete}
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
  );
}
