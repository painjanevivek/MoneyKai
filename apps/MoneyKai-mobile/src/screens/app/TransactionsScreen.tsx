import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import type { AppTabParamList } from '@/navigation/types';
import type { TransactionType } from '@/types/transaction';
import { createAppScreenStyles, formatDate } from './screenStyles';

type TransactionsNavigation = BottomTabNavigationProp<AppTabParamList, 'Transactions'>;

export function TransactionsScreen() {
  const navigation = useNavigation<TransactionsNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const transactions = useTransactionStore((state) => state.transactions);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TransactionType | 'all'>('all');

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return transactions
      .filter((item) => (type === 'all' ? true : item.type === type))
      .filter((item) => {
        if (!normalizedQuery) return true;
        return (
          item.description.toLowerCase().includes(normalizedQuery) ||
          item.category.toLowerCase().includes(normalizedQuery) ||
          item.payment_method.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }, [query, transactions, type]);

  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN')}`;

  const confirmDelete = (id: string) => {
    Alert.alert('Delete transaction?', 'This removes it from this account and Firestore sync.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>Transactions</Text>
              <Text style={styles.title}>Income and expenses</Text>
              <Text style={styles.subtitle}>Search, filter, and remove entries tied to your signed-in account.</Text>
            </View>

            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search description, category, or method"
              icon="magnify"
              autoCapitalize="none"
            />

            <View style={styles.chipRow}>
              {(['all', 'expense', 'income'] as const).map((item) => {
                const active = type === item;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setType(item)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item === 'all' ? 'All' : item[0].toUpperCase() + item.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button title="Add Transaction" onPress={() => navigation.navigate('Add')} icon="plus" style={{ marginBottom: Spacing.base }} />
          </>
        }
        ListEmptyComponent={
          <View style={styles.panel}>
            <Text style={styles.emptyText}>No matching transactions yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.panel}>
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', paddingRight: Spacing.md }}>
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
                <View style={{ flex: 1 }}>
                  <Text style={styles.value}>{item.description || item.category}</Text>
                  <Text style={styles.muted}>
                    {item.category} · {item.payment_method} · {formatDate(item.transaction_date)}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ ...styles.value, color: item.type === 'income' ? colors.success : colors.textPrimary }}>
                  {item.type === 'income' ? '+' : '-'}
                  {formatMoney(item.amount)}
                </Text>
                <TouchableOpacity onPress={() => confirmDelete(item.id)} style={{ marginTop: Spacing.sm }}>
                  <Text style={{ ...styles.muted, color: colors.error }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
