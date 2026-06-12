import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import type { AppTabParamList } from '@/navigation/types';
import { createAppScreenStyles, formatDate } from './screenStyles';

type HomeNavigation = BottomTabNavigationProp<AppTabParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const monthlyAllowance = useBudgetStore((state) => state.settings.monthly_allowance);
  const transactions = useTransactionStore((state) => state.transactions);

  const totalIncome = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalSpent;
  const remainingBudget = Math.max(monthlyAllowance - totalSpent, 0);
  const budgetPercent = monthlyAllowance > 0 ? Math.min((totalSpent / monthlyAllowance) * 100, 100) : 0;
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 4);

  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN')}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Dashboard</Text>
          <Text style={styles.title}>Hi, {user?.full_name?.split(' ')[0] || 'there'}</Text>
          <Text style={styles.subtitle}>Your latest money picture, synced to your account.</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.row}>
            <View>
              <Text style={styles.muted}>Net balance</Text>
              <Text style={{ ...styles.value, fontSize: Typography.fontSize['2xl'] }}>{formatMoney(balance)}</Text>
            </View>
            <MaterialCommunityIcons name={balance >= 0 ? 'trending-up' : 'trending-down'} size={28} color={colors.primary} />
          </View>
          <View style={styles.divider} />
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.muted}>Income</Text>
              <Text style={styles.value}>{formatMoney(totalIncome)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.muted}>Expenses</Text>
              <Text style={styles.value}>{formatMoney(totalSpent)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.row}>
            <View>
              <Text style={styles.muted}>Monthly budget</Text>
              <Text style={styles.value}>{monthlyAllowance > 0 ? formatMoney(remainingBudget) : 'Not set'}</Text>
            </View>
            <Button title="Edit" variant="secondary" size="sm" onPress={() => navigation.navigate('Budget')} />
          </View>
          <View
            style={{
              backgroundColor: colors.primaryBg,
              borderRadius: BorderRadius.full,
              height: 10,
              marginTop: Spacing.md,
              overflow: 'hidden',
            }}
          >
            <View style={{ backgroundColor: colors.primary, height: 10, width: `${budgetPercent}%` }} />
          </View>
          <Text style={{ ...styles.muted, marginTop: Spacing.sm }}>
            {monthlyAllowance > 0 ? `${Math.round(budgetPercent)}% used this cycle` : 'Set a budget to unlock spending guardrails.'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={{ ...styles.muted, color: colors.primary }}>View all</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.panel}>
            <Text style={styles.emptyText}>No transactions yet. Add your first income or expense to start tracking.</Text>
            <Button title="Add Transaction" onPress={() => navigation.navigate('Add')} style={{ marginTop: Spacing.base }} />
          </View>
        ) : (
          recentTransactions.map((item) => (
            <View key={item.id} style={styles.panel}>
              <View style={styles.row}>
                <View style={{ flex: 1, paddingRight: Spacing.md }}>
                  <Text style={styles.value}>{item.description || item.category}</Text>
                  <Text style={styles.muted}>
                    {item.category} · {formatDate(item.transaction_date)}
                  </Text>
                </View>
                <Text style={{ ...styles.value, color: item.type === 'income' ? colors.success : colors.textPrimary }}>
                  {item.type === 'income' ? '+' : '-'}
                  {formatMoney(item.amount)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
