import React, { useMemo, useState } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { MonthlyReset } from '@/components/dashboard/MonthlyReset';
import { BudgetHealth } from '@/components/dashboard/BudgetHealth';
import { MonthlyBudgetSummaryCard } from '@/components/dashboard/MonthlyBudgetSummaryCard';
import { CategoryBudgetRail } from '@/components/dashboard/CategoryBudgetRail';
import { MonthYearPickerSheet } from '@/components/calendar/MonthYearPickerSheet';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { EXPENSE_CATEGORIES } from '@/constants/categories';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { buildCategoryBudgetCards } from '@/utils/dashboard';
import { getMonthSummary } from '@/utils/monthAnalytics';
import { formatCurrency } from '@/utils/formatCurrency';

const buildCategoryLimitInputs = (limits: Record<string, number> = {}) =>
  EXPENSE_CATEGORIES.reduce<Record<string, string>>((acc, category) => {
    const value = limits[category.id];
    acc[category.id] = value && value > 0 ? String(value) : '';
    return acc;
  }, {});

export default function BudgetScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings } = useBudgetStore();
  const currencySymbol = useSettingsStore((s) => s.currencySymbol);
  const transactions = useTransactionStore((s) => s.transactions);
  const selectedMonthKey = useCalendarStore((s) => s.selectedMonthKey);
  const setSelectedMonthKey = useCalendarStore((s) => s.setSelectedMonthKey);
  const resetToCurrentMonth = useCalendarStore((s) => s.resetToCurrentMonth);
  const [categoryLimitDrafts, setCategoryLimitDrafts] = useState<Record<string, string>>({});
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showAllowanceEditor, setShowAllowanceEditor] = useState(false);
  const [allowanceValue, setAllowanceValue] = useState(String(settings.monthly_allowance));
  const [savingAllowance, setSavingAllowance] = useState(false);

  const monthSummary = useMemo(() => getMonthSummary(transactions, selectedMonthKey), [transactions, selectedMonthKey]);
  const monthLabel = monthSummary.monthLabel;
  const monthCategoryTotals = monthSummary.categoryTotals;
  const monthExpenses = monthSummary.expenses;
  const monthRemaining = settings.monthly_allowance - monthExpenses;
  const monthProgress = settings.monthly_allowance > 0 ? (monthExpenses / settings.monthly_allowance) * 100 : 0;
  const categoryCards = useMemo(
    () => buildCategoryBudgetCards(monthCategoryTotals, settings.category_limits),
    [monthCategoryTotals, settings.category_limits]
  );
  const setCategoryLimitInput = (categoryId: string, value: string) => {
    setCategoryLimitDrafts((current) => ({
      ...current,
      [categoryId]: value.replace(/[^0-9.]/g, ''),
    }));
  };
  const hasSavedCategoryLimits = Object.values(settings.category_limits ?? {}).some((value) => value > 0);
  const savedCategoryLimitInputs = useMemo(() => buildCategoryLimitInputs(settings.category_limits), [settings.category_limits]);
  const getCategoryLimitInput = (categoryId: string) => categoryLimitDrafts[categoryId] ?? savedCategoryLimitInputs[categoryId] ?? '';
  const switchTrack = { false: colors.border, true: colors.primary } as const;
  const switchThumb = colors.textInverse;

  const saveAllowance = () => {
    const parsed = Number(allowanceValue.replace(/,/g, '').trim());
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive monthly budget.');
      return;
    }

    setSavingAllowance(true);
    try {
      updateSettings({ monthly_allowance: Math.round(parsed) });
      setShowAllowanceEditor(false);
    } finally {
      setSavingAllowance(false);
    }
  };

  const handleSaveCategoryLimits = () => {
    const nextLimits: Record<string, number> = {};

    for (const category of EXPENSE_CATEGORIES) {
      const rawValue = getCategoryLimitInput(category.id).trim();
      if (!rawValue) continue;

      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
        Alert.alert('Invalid limit', `Enter a valid amount for ${category.name}.`);
        return;
      }

      if (parsed > 0) {
        nextLimits[category.id] = Math.round(parsed);
      }
    }

    updateSettings({ category_limits: nextLimits });
    setCategoryLimitDrafts({});
    Alert.alert('Category limits saved', 'Your optional category limits are now active for this budget.');
  };

  const handleClearCategoryLimits = () => {
    setCategoryLimitDrafts({});
    updateSettings({ category_limits: {} });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.base }}>
        <AppScreenHeader
          icon="wallet-outline"
          eyebrow="BUDGET CONTROL"
          title={`${monthLabel} budget`}
          description="Keep the monthly allowance, category guardrails, and reset behavior in one calm review surface."
          metrics={[
            { label: 'Allowance', value: formatCurrency(settings.monthly_allowance), tone: 'default' },
            { label: 'Spent', value: formatCurrency(monthExpenses), tone: 'warning' },
            { label: monthRemaining < 0 ? 'Over by' : 'Left', value: formatCurrency(Math.abs(monthRemaining)), tone: monthRemaining < 0 ? 'danger' : 'positive' },
          ]}
          chips={[
            { icon: 'calendar-month-outline', label: monthLabel },
            { icon: settings.carry_forward ? 'transfer-up' : 'transfer', label: settings.carry_forward ? 'Carry forward on' : 'Carry forward off' },
          ]}
          actions={
            <>
              <Button
                title="Change Month"
                icon="calendar-month-outline"
                onPress={() => setShowMonthPicker(true)}
                variant="outline"
                size="sm"
                tone="onDark"
              />
              <Button
                title="Edit Budget"
                icon="pencil-outline"
                onPress={() => {
                  setAllowanceValue(String(settings.monthly_allowance));
                  setShowAllowanceEditor(true);
                }}
                variant="outline"
                size="sm"
                tone="onDark"
              />
            </>
          }
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'], gap: Spacing.base }} showsVerticalScrollIndicator={false}>
        <MonthlyBudgetSummaryCard
          monthLabel={monthLabel}
          monthlyAllowance={settings.monthly_allowance}
          spent={monthExpenses}
          remaining={monthRemaining}
          progress={monthProgress}
        />

        <Card
          style={{
            gap: Spacing.md,
            borderRadius: BorderRadius['2xl'],
            borderWidth: 1,
            borderColor: colors.borderLight,
            ...Shadows.md,
            shadowColor: colors.shadowColor,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 22, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Budget Settings
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                Monthly budget controls for this app
              </Text>
            </View>
            <MaterialCommunityIcons name="wallet-outline" size={22} color={colors.primary} />
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => {
              setAllowanceValue(String(settings.monthly_allowance));
              setShowAllowanceEditor(true);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.md,
              minHeight: 58,
              paddingVertical: Spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: BorderRadius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primaryBg,
              }}
            >
              <MaterialCommunityIcons name="cash-multiple" size={19} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Monthly Budget
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                {formatCurrency(settings.monthly_allowance)}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 58 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: BorderRadius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <MaterialCommunityIcons name="transfer" size={19} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Carry Forward
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                Move unused balance to the next month
              </Text>
            </View>
            <Switch
              value={settings.carry_forward}
              onValueChange={(value) => updateSettings({ carry_forward: value })}
              trackColor={switchTrack}
              thumbColor={switchThumb}
              ios_backgroundColor={colors.borderLight}
            />
          </View>
        </Card>

        <BudgetHealth totalSpent={monthExpenses} />

        <MonthlyReset />

        <Card
          style={{
            gap: Spacing.md,
            borderRadius: BorderRadius['2xl'],
            borderWidth: 1,
            borderColor: colors.borderLight,
            ...Shadows.md,
            shadowColor: colors.shadowColor,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 22, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Category Limits
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                Optional monthly limits for each expense category
              </Text>
            </View>
            <MaterialCommunityIcons name="tune-variant" size={22} color={colors.primary} />
          </View>

          <View style={{ gap: Spacing.sm }}>
            {EXPENSE_CATEGORIES.map((category, index) => {
              const spent = monthCategoryTotals.find((item) => item.category === category.id)?.total ?? 0;
              return (
                <View
                  key={category.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.sm,
                    minHeight: 58,
                    paddingVertical: Spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: index === EXPENSE_CATEGORIES.length - 1 ? 'transparent' : colors.borderLight,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: BorderRadius.sm,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: category.colorLight,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                    }}
                  >
                    <MaterialCommunityIcons name={category.icon as any} size={19} color={category.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: Typography.fontSize.sm, lineHeight: 18, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}
                    >
                      {category.name}
                    </Text>
                    <Text numberOfLines={1} style={{ fontSize: Typography.fontSize.xs, lineHeight: 16, color: colors.textSecondary }}>
                      {formatCurrency(spent)} spent in {monthLabel}
                    </Text>
                  </View>
                  <Input
                    value={getCategoryLimitInput(category.id)}
                    onChangeText={(value) => setCategoryLimitInput(category.id, value)}
                    placeholder="No limit"
                    keyboardType="numeric"
                    prefix="Rs"
                    maxLength={8}
                    style={{ width: 132, marginBottom: 0 }}
                    inputStyle={{ fontSize: Typography.fontSize.sm }}
                  />
                </View>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {hasSavedCategoryLimits ? (
              <Button title="Clear" icon="close" onPress={handleClearCategoryLimits} variant="outline" style={{ flex: 1 }} />
            ) : null}
            <Button title="Save Limits" onPress={handleSaveCategoryLimits} style={{ flex: 1 }} />
          </View>
        </Card>

        <Card
          style={{
            gap: Spacing.md,
            borderRadius: BorderRadius['2xl'],
            borderWidth: 1,
            borderColor: colors.borderLight,
            ...Shadows.md,
            shadowColor: colors.shadowColor,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 22, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Quick Budget Actions
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                Jump into common budget tasks
              </Text>
            </View>
            <MaterialCommunityIcons name="wallet-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Button title="Transactions" onPress={() => router.push('/(tabs)/transactions')} variant="outline" style={{ flex: 1 }} />
            <Button title="Savings" onPress={() => router.push('/(tabs)/savings')} style={{ flex: 1 }} />
          </View>
        </Card>

        <CategoryBudgetRail items={categoryCards} />
      </ScrollView>
      <MonthYearPickerSheet
        visible={showMonthPicker}
        selectedMonthKey={selectedMonthKey}
        onSelect={setSelectedMonthKey}
        onClose={() => setShowMonthPicker(false)}
        onResetToCurrentMonth={resetToCurrentMonth}
      />
      <ModalSheet
        visible={showAllowanceEditor}
        title="Edit Monthly Budget"
        subtitle="Update the budget used across your dashboard, budget, and savings calculations."
        onClose={() => setShowAllowanceEditor(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <Button title="Cancel" onPress={() => setShowAllowanceEditor(false)} variant="outline" style={{ flex: 1 }} />
            <Button title="Save" onPress={saveAllowance} loading={savingAllowance} style={{ flex: 1 }} />
          </View>
        }
      >
        <Input
          label="Monthly budget"
          placeholder="15000"
          value={allowanceValue}
          onChangeText={(value) => setAllowanceValue(value.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          prefix={currencySymbol}
        />
      </ModalSheet>
    </SafeAreaView>
  );
}
