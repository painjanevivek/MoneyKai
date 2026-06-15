import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { MonthYearPickerSheet } from '@/components/calendar/MonthYearPickerSheet';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { CategoryBarChart } from '@/components/charts/CategoryBarChart';
import { SpendingInsightGraphs } from '@/components/charts/SpendingInsightGraphs';
import { SpendingPieChart } from '@/components/charts/SpendingPieChart';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { Card } from '@/components/ui/Card';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { getMonthSummary } from '@/utils/monthAnalytics';

const StatCard = ({
  label,
  amount,
  icon,
  tone,
}: {
  label: string;
  amount: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone: 'income' | 'expense' | 'neutral';
}) => {
  const { colors } = useTheme();
  const color = tone === 'expense' ? colors.emergency : tone === 'income' ? colors.primaryLight : colors.textPrimary;

  return (
    <Card
      variant="outlined"
      borderRadius="md"
      style={{
        flex: 1,
        minHeight: 96,
        gap: Spacing.sm,
        backgroundColor: colors.surface,
      }}
    >
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{label}</Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.78}
        style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color }}
      >
        {formatCurrency(Math.abs(amount))}
      </Text>
    </Card>
  );
};

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const transactions = useTransactionStore((s) => s.transactions);
  const monthlyAllowance = useBudgetStore((s) => s.settings.monthly_allowance);
  const selectedMonthKey = useCalendarStore((s) => s.selectedMonthKey);
  const setSelectedMonthKey = useCalendarStore((s) => s.setSelectedMonthKey);
  const resetToCurrentMonth = useCalendarStore((s) => s.resetToCurrentMonth);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const monthSummary = useMemo(() => getMonthSummary(transactions, selectedMonthKey), [transactions, selectedMonthKey]);
  const remaining = monthlyAllowance - monthSummary.expenses;
  const remainingLabel = remaining < 0 ? 'Overspent' : 'Available';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.base, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.xl, lineHeight: 28, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
            Analytics
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
            {monthSummary.monthLabel}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Select analytics month, currently ${monthSummary.monthLabel}`}
          activeOpacity={0.82}
          onPress={() => setShowMonthPicker(true)}
          style={{
            width: 44,
            height: 44,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            ...Shadows.sm,
            shadowColor: colors.shadowColor,
          }}
        >
          <MaterialCommunityIcons name="calendar-month-outline" size={21} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'], gap: Spacing.base }}
      >
        <TrendLineChart transactions={transactions} title="Spending Overview" subtitle="Last 5 Weeks" />

        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <StatCard label="Income" amount={monthSummary.income} icon="arrow-down-circle-outline" tone="income" />
          <StatCard label="Expenses" amount={monthSummary.expenses} icon="arrow-up-circle-outline" tone="expense" />
        </View>

        <Card
          variant="outlined"
          borderRadius="md"
          style={{
            backgroundColor: remaining < 0 ? colors.emergencyBg : colors.surface,
            borderColor: remaining < 0 ? `${colors.emergency}44` : colors.borderLight,
            gap: Spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <MaterialCommunityIcons
              name={remaining < 0 ? 'alert-circle-outline' : 'wallet-outline'}
              size={22}
              color={remaining < 0 ? colors.emergency : colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {remainingLabel}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                Budget minus selected-month expenses
              </Text>
            </View>
            <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: remaining < 0 ? colors.emergency : colors.primary }}>
              {formatCurrency(Math.abs(remaining))}
            </Text>
          </View>
        </Card>

        <SpendingPieChart
          categoryTotals={monthSummary.categoryTotals}
          totalSpent={monthSummary.expenses}
          onPressViewMore={() => router.push('/(tabs)/budget')}
        />

        <CategoryBarChart
          categoryTotals={monthSummary.categoryTotals}
          onViewAll={() => router.push('/(tabs)/budget')}
        />

        <SpendingInsightGraphs
          transactions={monthSummary.transactions}
          monthlyAllowance={monthlyAllowance}
          totalIncome={monthSummary.income}
          totalSpent={monthSummary.expenses}
        />

        <RecentTransactions
          transactions={monthSummary.transactions.slice(0, 6)}
          onViewAll={() => router.push('/(tabs)/transactions')}
        />
      </ScrollView>

      <MonthYearPickerSheet
        visible={showMonthPicker}
        selectedMonthKey={selectedMonthKey}
        onSelect={setSelectedMonthKey}
        onClose={() => setShowMonthPicker(false)}
        onResetToCurrentMonth={resetToCurrentMonth}
      />
    </SafeAreaView>
  );
}
