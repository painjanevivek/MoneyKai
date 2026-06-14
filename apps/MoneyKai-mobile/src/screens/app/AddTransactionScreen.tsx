import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/theme';
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

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const selectType = (nextType: TransactionType) => {
    setType(nextType);
    setCategory(nextType === 'expense' ? EXPENSE_CATEGORIES[0].id : INCOME_CATEGORIES[0].id);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate.toISOString().slice(0, 10));
    }
  };

  const submit = () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Amount needed', 'Enter a valid amount greater than zero.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description needed', 'Add a short description for this transaction.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Date format', 'Use YYYY-MM-DD for the transaction date.');
      return;
    }

    const saved = addTransaction({
      user_id: user?.id ?? 'local',
      type,
      amount: numericAmount,
      category,
      description: description.trim(),
      payment_method: paymentMethod,
      transaction_date: date,
    });

    if (!saved) {
      Alert.alert('Set a budget first', 'MoneyKai needs a monthly budget before transactions can be added.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Budget', onPress: () => navigation.navigate('Budget') },
      ]);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Add</Text>
          <Text style={styles.title}>New transaction</Text>
          <Text style={styles.subtitle}>Capture income or expenses directly in MoneyKai.</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.chipRow}>
            {(['expense', 'income'] as const).map((item) => {
              const active = type === item;
              return (
                <TouchableOpacity key={item} onPress={() => selectType(item)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {item[0].toUpperCase() + item.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            label="Amount"
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            inputMode="decimal"
            icon="currency-inr"
            prefix={currencySymbol}
          />
          <Input
            label="Description"
            placeholder="Lunch, salary, rent..."
            value={description}
            onChangeText={setDescription}
            icon="text"
          />
          <View style={{ marginBottom: Spacing.base }}>
            <Text style={styles.muted}>Date</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Choose transaction date"
              activeOpacity={0.75}
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
            </TouchableOpacity>
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
                <TouchableOpacity key={item.id} onPress={() => setCategory(item.id)} style={[styles.chip, active && styles.chipActive]}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={16}
                    color={active ? colors.textInverse : colors.textSecondary}
                    style={{ marginRight: Spacing.xs }}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Payment method</Text>
          <View style={styles.chipRow}>
            {PAYMENT_METHODS.map((item) => {
              const active = paymentMethod === item.id;
              return (
                <TouchableOpacity key={item.id} onPress={() => setPaymentMethod(item.id)} style={[styles.chip, active && styles.chipActive]}>
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={16}
                    color={active ? colors.textInverse : colors.textSecondary}
                    style={{ marginRight: Spacing.xs }}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button title="Save Transaction" onPress={submit} icon="content-save-outline" style={{ marginTop: Spacing.sm }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
