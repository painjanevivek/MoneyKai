import React, { useMemo, useState } from 'react';
import { Alert, SectionList, Text, TouchableOpacity, View } from 'react-native';
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
import { PAYMENT_METHODS, getCategoryById } from '@/constants/categories';
import type { AppTabParamList } from '@/navigation/types';
import type { TransactionType } from '@/types/transaction';
import type { Transaction } from '@/types/transaction';
import { getMonthKey, getMonthLabel } from '@/utils/dashboard';
import { titleCase } from '@/utils/labels';
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
  const formatCategory = (categoryId: string) => getCategoryById(categoryId)?.name ?? titleCase(categoryId);
  const formatPaymentMethod = (methodId: string) => PAYMENT_METHODS.find((item) => item.id === methodId)?.name ?? titleCase(methodId);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return transactions
      .filter((item) => (type === 'all' ? true : item.type === type))
      .filter((item) => {
        if (!normalizedQuery) return true;
        return (
          item.description.toLowerCase().includes(normalizedQuery) ||
          formatCategory(item.category).toLowerCase().includes(normalizedQuery) ||
          formatPaymentMethod(item.payment_method).toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }, [query, transactions, type]);

  const sections = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    filtered.forEach((transaction) => {
      const monthKey = getMonthKey(transaction.transaction_date);
      const items = grouped.get(monthKey) ?? [];
      items.push(transaction);
      grouped.set(monthKey, items);
    });

    return [...grouped.entries()]
      .sort(([monthA], [monthB]) => monthB.localeCompare(monthA))
      .map(([monthKey, data]) => ({
        title: getMonthLabel(monthKey),
        data: data.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()),
      }));
  }, [filtered]);

  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN')}`;

  const confirmDelete = (id: string) => {
    Alert.alert('Delete transaction?', 'This removes it from this account and Firestore sync.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        stickySectionHeadersEnabled={false}
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
        renderSectionHeader={({ section }) => (
          <View style={{ paddingTop: Spacing.sm }}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
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
                  <Text style={styles.value}>{item.description || formatCategory(item.category)}</Text>
                  <Text style={styles.muted}>
                    {formatCategory(item.category)} - {formatPaymentMethod(item.payment_method)} - {formatDate(item.transaction_date)}
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
