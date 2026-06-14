import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { getCategoryById } from '@/constants/categories';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import type { AppTabParamList, RootStackParamList } from '@/navigation/types';
import { filterTransactionsByMonth, getMonthKey, getMonthLabel } from '@/utils/dashboard';
import { titleCase } from '@/utils/labels';
import { createAppScreenStyles, formatDate } from './screenStyles';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type ShortcutRoute = 'Savings' | 'Groups' | 'AutoCapture' | 'Learn';

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const monthlyAllowance = useBudgetStore((state) => state.settings.monthly_allowance);
  const transactions = useTransactionStore((state) => state.transactions);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const selectedMonthKey = getMonthKey(selectedMonthDate);
  const selectedMonthLabel = getMonthLabel(selectedMonthKey);
  const currentMonthTransactions = filterTransactionsByMonth(transactions, selectedMonthKey);
  const totalIncome = currentMonthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = currentMonthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const availableFunds = monthlyAllowance + totalIncome;
  const balance = availableFunds - totalSpent;
  const isOverspent = balance < 0;
  const remainingBudget = Math.max(monthlyAllowance - totalSpent, 0);
  const budgetPercent = monthlyAllowance > 0 ? Math.min((totalSpent / monthlyAllowance) * 100, 100) : 0;
  const recentTransactions = [...currentMonthTransactions]
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 4);
  const shortcuts: Array<{ title: string; route: ShortcutRoute; icon: string; caption: string; color: string }> = [
    { title: 'Savings', route: 'Savings', icon: 'piggy-bank-outline', caption: 'Streaks', color: colors.primary },
    { title: 'Groups', route: 'Groups', icon: 'account-group-outline', caption: 'Split bills', color: colors.textPrimary },
    { title: 'Capture', route: 'AutoCapture', icon: 'radar', caption: 'Drafts', color: colors.textPrimary },
    { title: 'Learn', route: 'Learn', icon: 'school-outline', caption: 'Guides', color: colors.primary },
  ];

  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN')}`;
  const formatCategory = (categoryId: string) => getCategoryById(categoryId)?.name ?? titleCase(categoryId);
  const onMonthChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowMonthPicker(false);
    if (event.type === 'set' && selectedDate) {
      setSelectedMonthDate(selectedDate);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { flexDirection: 'row', gap: Spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Dashboard</Text>
            <Text style={styles.title}>Hi, {user?.full_name?.split(' ')[0] || 'there'}</Text>
            <Text style={styles.subtitle}>{selectedMonthLabel} money picture, synced to your account.</Text>
          </View>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Choose dashboard month"
              activeOpacity={0.75}
              onPress={() => setShowMonthPicker(true)}
              style={{
                alignItems: 'center',
                backgroundColor: colors.card,
                borderColor: colors.borderLight,
                borderRadius: BorderRadius.full,
                borderWidth: 1,
                height: 48,
                justifyContent: 'center',
                width: 48,
              }}
            >
              <Text style={{ fontSize: 20 }}>📅</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              activeOpacity={0.75}
              onPress={() => navigation.navigate('Notifications')}
              style={{
                alignItems: 'center',
                backgroundColor: colors.card,
                borderColor: colors.borderLight,
                borderRadius: BorderRadius.full,
                borderWidth: 1,
                height: 48,
                justifyContent: 'center',
                width: 48,
              }}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color={colors.primary} />
              {unreadCount > 0 && (
                <View
                  style={{
                    backgroundColor: colors.textPrimary,
                    borderColor: colors.card,
                    borderRadius: BorderRadius.full,
                    borderWidth: 2,
                    height: 12,
                    position: 'absolute',
                    right: 11,
                    top: 10,
                    width: 12,
                  }}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open avatar profile" activeOpacity={0.75} onPress={() => navigation.navigate('ProfileEdit')}>
              <UserAvatar name={user?.full_name} email={user?.email} avatarUrl={user?.avatar_url} size={48} />
            </TouchableOpacity>
          </View>
        </View>
        {showMonthPicker && (
          <DateTimePicker
            value={selectedMonthDate}
            mode="date"
            display="calendar"
            onChange={onMonthChange}
          />
        )}

        <View style={styles.panel}>
          <View style={styles.row}>
            <View>
              <Text style={styles.muted}>{isOverspent ? 'Overspent' : 'Available to spend'}</Text>
              <Text
                style={{
                  ...styles.value,
                  color: isOverspent ? colors.error : colors.success,
                  fontSize: Typography.fontSize['2xl'],
                }}
              >
                {formatMoney(Math.abs(balance))}
              </Text>
            </View>
            <MaterialCommunityIcons name={balance >= 0 ? 'trending-up' : 'trending-down'} size={28} color={isOverspent ? colors.error : colors.success} />
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
          <Text style={styles.sectionTitle}>Quick tools</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('More')}>
            <Text style={{ ...styles.muted, color: colors.primary }}>More</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.base }}>
          {shortcuts.map((shortcut) => (
            <TouchableOpacity
              key={shortcut.route}
              accessibilityRole="button"
              accessibilityLabel={`Open ${shortcut.title}`}
              activeOpacity={0.78}
              onPress={() => navigation.navigate(shortcut.route)}
              style={{
                backgroundColor: colors.card,
                borderColor: colors.borderLight,
                borderRadius: BorderRadius.md,
                borderWidth: 1,
                flexBasis: '47%',
                flexGrow: 1,
                minHeight: 96,
                padding: Spacing.base,
              }}
            >
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.primaryBg,
                  borderRadius: BorderRadius.md,
                  height: 38,
                  justifyContent: 'center',
                  marginBottom: Spacing.md,
                  width: 38,
                }}
              >
                <MaterialCommunityIcons name={shortcut.icon} size={20} color={shortcut.color} />
              </View>
              <Text style={styles.value}>{shortcut.title}</Text>
              <Text style={styles.muted}>{shortcut.caption}</Text>
            </TouchableOpacity>
          ))}
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
                  <Text style={styles.value}>{item.description || formatCategory(item.category)}</Text>
                  <Text style={styles.muted}>
                    {formatCategory(item.category)} - {formatDate(item.transaction_date)}
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
