import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenState } from '@/components/ui/ScreenState';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import type { AppTabParamList } from '@/navigation/types';
import type { TransactionType } from '@/types/transaction';
import { createAppScreenStyles } from './screenStyles';

type AddNavigation = BottomTabNavigationProp<AppTabParamList, 'Add'>;

export function AddTransactionScreen() {
  const navigation = useNavigation<AddNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0].id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const selectType = (nextType: TransactionType) => {
    setFormError(null);
    setType(nextType);
    setCategory(nextType === 'expense' ? EXPENSE_CATEGORIES[0].id : INCOME_CATEGORIES[0].id);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setFormError(null);
      setDate(selectedDate.toISOString().slice(0, 10));
    }
  };

  const submit = () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Enter a valid amount greater than zero.');
      return;
    }
    if (!description.trim()) {
      setFormError('Add a short description for this transaction.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setFormError('Choose a valid transaction date.');
      return;
    }

    setFormError(null);
    setIsSaving(true);
    const saved = addTransaction({
      user_id: user?.id ?? 'local',
      type,
      amount: numericAmount,
      category,
      description: description.trim(),
      payment_method: paymentMethod,
      transaction_date: date,
    });
    setIsSaving(false);

    if (!saved) {
      setFormError('Set a monthly budget before adding transactions, or remove any duplicate captured entry.');
      return;
    }

    setAmount('');
    setDescription('');
    navigation.navigate('Transactions');
  };

  const selectedDate = new Date(`${date}T00:00:00`);
  const displayDate = Number.isFinite(selectedDate.getTime())
    ? selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : date;
  const previewAmount = Number(amount);
  const hasPreview = Number.isFinite(previewAmount) && previewAmount > 0 && description.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Add transaction</Text>
          <Text style={styles.subtitle}>Add income or expenses directly when an SMS alert is missing or needs correction.</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.chipRow}>
            {(['expense', 'income'] as const).map((item) => {
              const active = type === item;
              return (
                <PressableScale key={item} onPress={() => selectType(item)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {item[0].toUpperCase() + item.slice(1)}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          {formError && (
            <ScreenState
              actionLabel={formError.startsWith('Set a monthly budget') ? 'Open Budget' : undefined}
              body={formError}
              icon="alert-circle-outline"
              onAction={formError.startsWith('Set a monthly budget') ? () => navigation.navigate('Budget') : undefined}
              style={{ marginBottom: Spacing.base, padding: Spacing.base }}
              title="Needs attention"
              tone="danger"
            />
          )}

          <Input
            label="Amount"
            placeholder="0"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              if (formError) setFormError(null);
            }}
            keyboardType="decimal-pad"
            inputMode="decimal"
            prefix={currencySymbol}
          />
          <Input
            label="Description"
            placeholder="Lunch, salary, rent..."
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (formError) setFormError(null);
            }}
            icon="text"
          />
          <View style={{ marginBottom: Spacing.base }}>
            <Text style={styles.muted}>Date</Text>
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
                minHeight: 52,
                paddingHorizontal: Spacing.md,
                marginTop: Spacing.xs,
              }}
            >
              <MaterialCommunityIcons name="calendar-month-outline" size={22} color={colors.primary} />
              <Text style={[styles.value, { flex: 1 }]}>{displayDate}</Text>
              <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textTertiary} />
            </PressableScale>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={Number.isFinite(selectedDate.getTime()) ? selectedDate : new Date()}
              mode="date"
              display="calendar"
              onChange={onDateChange}
            />
          )}

          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.chipRow}>
            {categories.map((item) => {
              const active = category === item.id;
              return (
                <PressableScale key={item.id} onPress={() => setCategory(item.id)} style={[styles.chip, active && styles.chipActive]}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={16}
                    color={active ? colors.textInverse : colors.textSecondary}
                    style={{ marginRight: Spacing.xs }}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
                </PressableScale>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Payment method</Text>
          <View style={styles.chipRow}>
            {PAYMENT_METHODS.map((item) => {
              const active = paymentMethod === item.id;
              return (
                <PressableScale key={item.id} onPress={() => setPaymentMethod(item.id)} style={[styles.chip, active && styles.chipActive]}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={16}
                    color={active ? colors.textInverse : colors.textSecondary}
                    style={{ marginRight: Spacing.xs }}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
                </PressableScale>
              );
            })}
          </View>

          <View
            style={{
              backgroundColor: colors.primaryBg,
              borderColor: `${colors.primary}22`,
              borderRadius: BorderRadius.sm,
              borderWidth: 1,
              marginBottom: Spacing.base,
              padding: Spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <MaterialCommunityIcons name={hasPreview ? 'check-circle-outline' : 'information-outline'} size={20} color={colors.primary} />
              <Text style={{ color: colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>
                {hasPreview ? 'Ready to save' : 'What happens after saving'}
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, marginTop: Spacing.sm }}>
              {hasPreview
                ? `${type === 'income' ? 'Income' : 'Expense'} of ${currencySymbol}${previewAmount.toLocaleString('en-IN')} will update this month, dashboard totals, and category review.`
                : 'Add an amount and description, then MoneyKai will include this record across your dashboard, budgets, and reports.'}
            </Text>
          </View>

          <Button title="Save transaction" onPress={submit} loading={isSaving} style={{ marginTop: Spacing.sm }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
