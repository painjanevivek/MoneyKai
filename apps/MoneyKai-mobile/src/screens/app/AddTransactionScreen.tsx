import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import type { AppTabParamList } from '@/navigation/types';
import type { TransactionType } from '@/types/transaction';
import { createAppScreenStyles } from './screenStyles';

const EXPENSE_CATEGORIES = ['food', 'transport', 'shopping', 'bills', 'rent', 'healthcare', 'education', 'entertainment', 'others'];
const INCOME_CATEGORIES = ['salary', 'freelance', 'refund', 'gift', 'others'];
const PAYMENT_METHODS = ['upi', 'card', 'cash', 'bank'];

type AddNavigation = BottomTabNavigationProp<AppTabParamList, 'Add'>;

export function AddTransactionScreen() {
  const navigation = useNavigation<AddNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const selectType = (nextType: TransactionType) => {
    setType(nextType);
    setCategory(nextType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
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
    Alert.alert('Transaction saved', 'Your entry was saved and queued for account sync.', [
      { text: 'Add another' },
      { text: 'View list', onPress: () => navigation.navigate('Transactions') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Add</Text>
          <Text style={styles.title}>New transaction</Text>
          <Text style={styles.subtitle}>Capture income or expenses directly in the CLI app.</Text>
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
          />
          <Input
            label="Description"
            placeholder="Lunch, salary, rent..."
            value={description}
            onChangeText={setDescription}
            icon="text"
          />
          <Input
            label="Date"
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
            icon="calendar-outline"
            keyboardType="number-pad"
          />

          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.chipRow}>
            {categories.map((item) => {
              const active = category === item;
              return (
                <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Payment method</Text>
          <View style={styles.chipRow}>
            {PAYMENT_METHODS.map((item) => {
              const active = paymentMethod === item;
              return (
                <TouchableOpacity key={item} onPress={() => setPaymentMethod(item)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
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
