import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenState } from '@/components/ui/ScreenState';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import type { AppTabParamList, RootStackParamList } from '@/navigation/types';
import { filterTransactionsByMonth, getMonthKey, getMonthLabel } from '@/utils/dashboard';
import { getCategoryById } from '@/constants/categories';
import { titleCase } from '@/utils/labels';
import { createAppScreenStyles, formatDate } from './screenStyles';

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeOverviewScreen() {
  const navigation = useNavigation<HomeNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const monthlyAllowance = useBudgetStore((state) => state.settings.monthly_allowance);
  const transactions = useTransactionStore((state) => state.transactions);
  const isOnline = useSyncStore((state) => state.isOnline);
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const syncError = useSyncStore((state) => state.error);
  const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const selectedMonthKey = getMonthKey(selectedMonthDate);
  const selectedMonthLabel = getMonthLabel(selectedMonthKey);
  const monthRecords = useMemo(() => filterTransactionsByMonth(transactions, selectedMonthKey), [selectedMonthKey, transactions]);
  const totals = useMemo(() => monthRecords.reduce((result, item) => {
    result[item.type === 'income' ? 'income' : 'spent'] += item.amount;
    return result;
  }, { income: 0, spent: 0 }), [monthRecords]);
  const available = monthlyAllowance + totals.income - totals.spent;
  const budgetPercent = monthlyAllowance > 0 ? Math.min((totals.spent / monthlyAllowance) * 100, 100) : 0;
  const recent = useMemo(() => [...monthRecords].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()).slice(0, 3), [monthRecords]);
  const formatMoney = (value: number) => `${currencySymbol}${Math.abs(value).toLocaleString('en-IN')}`;
  const formatCategory = (id: string) => getCategoryById(id)?.name ?? titleCase(id);
  const onMonthChange = (event: DateTimePickerEvent, value?: Date) => {
    setShowMonthPicker(false);
    if (event.type === 'set' && value) setSelectedMonthDate(value);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { flexDirection: 'row', gap: Spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.title}>Hi, {user?.full_name?.split(' ')[0] || 'there'}</Text>
            <Text style={styles.subtitle}>{selectedMonthLabel} at a glance.</Text>
          </View>
          <PressableScale accessibilityLabel="Choose dashboard month" accessibilityRole="button" onPress={() => setShowMonthPicker(true)} style={{ alignItems: 'center', backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.full, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 }}>
            <AppIcon color={colors.primary} name="calendar-month-outline" size={21} />
          </PressableScale>
        </View>
        {showMonthPicker ? <DateTimePicker value={selectedMonthDate} mode="date" display="calendar" onChange={onMonthChange} /> : null}

        {!isOnline || pendingCount > 0 || syncError ? (
          <FeedbackBanner
            title={!isOnline ? 'Working offline' : syncError ? 'Sync needs attention' : 'Changes waiting to sync'}
            message={!isOnline ? `${pendingCount} queued change${pendingCount === 1 ? '' : 's'} will retry when connected.` : syncError ?? `${pendingCount} queued change${pendingCount === 1 ? '' : 's'}.`}
            tone={syncError ? 'danger' : 'warning'}
          />
        ) : null}

        <View style={[styles.panel, { backgroundColor: colors.textPrimary, paddingVertical: Spacing.xl }]}> 
          <Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm }}>{available < 0 ? 'Overspent' : 'Available to spend'}</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: available < 0 ? colors.warningBg : colors.textInverse, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['4xl'], lineHeight: Typography.lineHeight['4xl'], marginTop: Spacing.xs }}>{formatMoney(available)}</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.lg }}>
            <View><Text style={{ color: colors.textInverse, opacity: 0.7 }}>Income</Text><Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.semiBold }}>{formatMoney(totals.income)}</Text></View>
            <View><Text style={{ color: colors.textInverse, opacity: 0.7 }}>Spent</Text><Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.semiBold }}>{formatMoney(totals.spent)}</Text></View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.muted}>Monthly budget</Text>
              <Text style={styles.value}>{monthlyAllowance > 0 ? `${Math.round(budgetPercent)}% used` : 'Not set'}</Text>
            </View>
            <Button title="Review" size="sm" variant="secondary" onPress={() => navigation.navigate('Budget')} />
          </View>
          <View style={{ backgroundColor: colors.primaryBg, borderRadius: BorderRadius.full, height: 8, marginTop: Spacing.md, overflow: 'hidden' }}>
            <View style={{ backgroundColor: colors.primary, height: 8, width: `${budgetPercent}%` }} />
          </View>
          <Disclosure title="Budget detail" summary={`${formatMoney(totals.spent)} spent of ${formatMoney(monthlyAllowance)}`}>
            <Text style={styles.muted}>Income is added to your available figure. The budget progress bar compares expenses with the monthly allowance.</Text>
          </Disclosure>
        </View>

        <View style={styles.row}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Recent activity</Text>
          <PressableScale accessibilityRole="button" onPress={() => navigation.navigate('Transactions')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.primary, fontFamily: Typography.fontFamily.medium }}>View all</Text></PressableScale>
        </View>
        {recent.length === 0 ? (
          <ScreenState kind="empty" title="No records this month" body="Add one income or expense to start the monthly view." actionLabel="Add transaction" onAction={() => navigation.navigate('Add')} />
        ) : recent.map((item) => (
          <View key={item.id} style={styles.panel}>
            <View style={styles.row}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={styles.value}>{item.description || formatCategory(item.category)}</Text>
                <Text style={styles.muted}>{formatCategory(item.category)} · {formatDate(item.transaction_date)}</Text>
              </View>
              <Text style={[styles.value, { color: item.type === 'income' ? colors.success : colors.textPrimary }]}>{item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}</Text>
            </View>
          </View>
        ))}

        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Button title="Add transaction" icon="plus" onPress={() => navigation.navigate('Add')} style={{ flex: 1 }} />
          <Button title="Groups" icon="account-group-outline" variant="outline" onPress={() => navigation.navigate('Groups')} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
