import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Animated, Dimensions, Easing, Modal, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ExpoDateTimePicker from '@expo/ui/community/datetime-picker';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Button } from '@/components/ui/Button';
import { BudgetRequiredDialog } from '@/components/ui/BudgetRequiredDialog';
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
const SHEET_INITIAL_OFFSET = Dimensions.get('window').height;

export function TransactionComposerSheet({
  visible,
  editingTransaction = null,
  onClose,
}: TransactionComposerSheetProps) {
  const { colors } = useTheme();
  const userId = useAuthStore((s) => s.user?.id ?? 'local');
  const monthlyAllowance = useBudgetStore((s) => s.settings.monthly_allowance);
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactionStore();
  const isEditing = editingTransaction !== null;

  const [txnType, setTxnType] = useState<'expense' | 'income'>(editingTransaction?.type ?? 'expense');
  const [txnAmount, setTxnAmount] = useState(editingTransaction ? String(editingTransaction.amount) : '');
  const [txnCategory, setTxnCategory] = useState(editingTransaction?.category ?? '');
  const [txnDescription, setTxnDescription] = useState(editingTransaction?.description ?? '');
  const [txnPayment, setTxnPayment] = useState(editingTransaction?.payment_method ?? 'upi');
  const [txnDate, setTxnDate] = useState(editingTransaction?.transaction_date ?? getTodayDate());
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [sheetTranslateY] = useState(() => new Animated.Value(SHEET_INITIAL_OFFSET));
  const [backdropOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      sheetTranslateY.setValue(SHEET_INITIAL_OFFSET);
      backdropOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, sheetTranslateY, visible]);

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

  const showBudgetRequiredAlert = () => {
    setShowBudgetDialog(true);
  };

  const handleSetBudgetFromDialog = () => {
    setShowBudgetDialog(false);
    handleClose();
    router.push('/(tabs)/budget');
  };

  const handleSubmitTransaction = () => {
    if (!isEditing && monthlyAllowance <= 0) {
      showBudgetRequiredAlert();
      return;
    }

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
      const didAddTransaction = addTransaction(transactionPayload);
      if (!didAddTransaction) {
        showBudgetRequiredAlert();
        return;
      }
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
    <>
      <Modal visible={visible} animationType="none" transparent statusBarTranslucent onRequestClose={handleClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: colors.overlay,
              opacity: backdropOpacity,
            }}
          />
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
          <Animated.View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              paddingHorizontal: Spacing.xl,
              paddingTop: Spacing.lg,
              paddingBottom: Spacing.xl,
              maxHeight: '85%',
              transform: [{ translateY: sheetTranslateY }],
            }}
          >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl }}>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              {isEditing ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close add transaction"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: Spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
              {(['expense', 'income'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    setTxnType(type);
                    setTxnCategory('');
                  }}
                  style={{
                    flex: 1,
                    minHeight: 76,
                    paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
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
              keyboardType="number-pad"
              inputMode="numeric"
              icon="currency-inr"
            />
            <Input
              label="Description"
              placeholder="What was this for?"
              value={txnDescription}
              onChangeText={setTxnDescription}
              icon="text-short"
              returnKeyType="done"
            />

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
                    justifyContent: 'center',
                    gap: Spacing.xs,
                    minHeight: 44,
                    paddingHorizontal: Spacing.md,
                    borderRadius: BorderRadius.full,
                    backgroundColor: txnCategory === cat.id ? `${cat.color}15` : colors.surface,
                    borderWidth: 1.5,
                    borderColor: txnCategory === cat.id ? cat.color : colors.border,
                  }}
                >
                  <MaterialCommunityIcons name={cat.icon as any} size={16} color={txnCategory === cat.id ? cat.color : colors.textTertiary} />
                  <Text
                    numberOfLines={1}
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
                    minHeight: 72,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: Spacing.sm,
                    paddingHorizontal: Spacing.xs,
                    borderRadius: BorderRadius.md,
                    backgroundColor: txnPayment === pm.id ? colors.primaryBg : colors.surface,
                    borderWidth: 1.5,
                    borderColor: txnPayment === pm.id ? colors.primary : colors.border,
                  }}
                >
                  <MaterialCommunityIcons name={pm.icon as any} size={18} color={txnPayment === pm.id ? colors.primary : colors.textTertiary} />
                  <Text
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                    style={{
                      fontSize: 10,
                      fontFamily: Typography.fontFamily.medium,
                      marginTop: 2,
                      color: txnPayment === pm.id ? colors.primary : colors.textSecondary,
                      lineHeight: 13,
                      minHeight: 26,
                      textAlign: 'center',
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
          </Animated.View>
        </View>
      </Modal>
      <BudgetRequiredDialog
        visible={showBudgetDialog}
        message="Set a monthly budget before adding transactions."
        onCancel={() => setShowBudgetDialog(false)}
        onSetBudget={handleSetBudgetFromDialog}
      />
    </>
  );
}
