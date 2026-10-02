import React, { useMemo, useState } from 'react';
import { ScrollView, Switch, TextInput, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { AppIcon as MaterialCommunityIcons } from '@/components/ui/AppIcon';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Disclosure } from '@/components/ui/Disclosure';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { CenteredPageHeader } from '@/components/ui/CenteredPageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenState } from '@/components/ui/ScreenState';
import { EXPENSE_CATEGORIES, getCategoryById } from '@/constants/categories';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useTheme } from '@/hooks/useTheme';
import type { CategoryTotal } from '@/types/transaction';
import { buildCategoryTotals, filterTransactionsByMonth, getMonthKey } from '@/utils/dashboard';
import { createAppScreenStyles } from './screenStyles';

const toLimitDrafts = (limits?: Record<string, number>) =>
  EXPENSE_CATEGORIES.reduce<Record<string, string>>((acc, category) => {
    const value = limits?.[category.id];
    acc[category.id] = value && value > 0 ? String(value) : '';
    return acc;
  }, {});

const normalizeLimits = (drafts: Record<string, string>) =>
  Object.entries(drafts).reduce<Record<string, number>>((acc, [categoryId, value]) => {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) {
      acc[categoryId] = amount;
    }
    return acc;
  }, {});

function BudgetSpendingPieChart({
  spentTotals,
  formatMoney,
}: {
  spentTotals: CategoryTotal[];
  formatMoney: (value: number) => string;
}) {
  const { colors } = useTheme();
  const totalSpent = spentTotals.reduce((sum, item) => sum + item.total, 0);
  const circumference = 2 * Math.PI * 58;
  const chartColors = [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5, colors.chart6, colors.chart7, colors.chart8];

  return (
    <View style={{ marginBottom: Spacing.base }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <MaterialCommunityIcons name="chart-donut" size={22} color={colors.primaryDark} />
        <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg }}>
          Spending split
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.base }}>
        <View style={{ height: 142, width: 142, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={136} height={136} viewBox="0 0 136 136" style={{ position: 'absolute' }}>
            <Circle cx={68} cy={68} r={58} stroke={colors.borderLight} strokeWidth={18} fill="none" />
            {totalSpent > 0 &&
              spentTotals.slice(0, 8).reduce<{ nodes: React.ReactNode[]; offset: number }>(
                (acc, item, index) => {
                  const dash = (item.total / totalSpent) * circumference;
                  acc.nodes.push(
                    <Circle
                      key={item.category}
                      cx={68}
                      cy={68}
                      r={58}
                      stroke={chartColors[index % chartColors.length]}
                      strokeWidth={18}
                      fill="none"
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={-acc.offset}
                      strokeLinecap="round"
                      rotation={-90}
                      originX={68}
                      originY={68}
                    />
                  );
                  acc.offset += dash;
                  return acc;
                },
                { nodes: [], offset: 0 }
              ).nodes}
          </Svg>
          <View style={{ alignItems: 'center', maxWidth: 92 }}>
            <Text style={{ color: colors.textTertiary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs }}>
              Spent
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md }}
            >
              {formatMoney(totalSpent)}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: Spacing.sm }}>
          {spentTotals.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm }}>
              Add expenses to see where your money is going.
            </Text>
          ) : (
            spentTotals.slice(0, 5).map((item, index) => {
              const category = getCategoryById(item.category);
              const percent = Math.round(item.percentage);
              return (
                <View key={item.category} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <View style={{ height: 9, width: 9, borderRadius: 5, backgroundColor: chartColors[index % chartColors.length] }} />
                  <Text
                    numberOfLines={1}
                    style={{ flex: 1, color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}
                  >
                    {category?.name ?? item.category}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs }}>
                    {percent}%
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}

export function BudgetScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const settings = useBudgetStore((state) => state.settings);
  const isEmergencyMode = useBudgetStore((state) => state.isEmergencyMode);
  const adjustments = useBudgetStore((state) => state.adjustments);
  const updateSettings = useBudgetStore((state) => state.updateSettings);
  const addAdjustment = useBudgetStore((state) => state.addAdjustment);
  const toggleEmergencyMode = useBudgetStore((state) => state.toggleEmergencyMode);
  const transactions = useTransactionStore((state) => state.transactions);
  const [allowance, setAllowance] = useState(String(settings.monthly_allowance || ''));
  const [resetDay, setResetDay] = useState(String(settings.reset_day || 1));
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [categoryLimitDrafts, setCategoryLimitDrafts] = useState(() => toLimitDrafts(settings.category_limits));
  const [budgetNotice, setBudgetNotice] = useState<{ tone: 'danger' | 'primary'; title: string; body: string } | null>(null);

  const currentMonthTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, getMonthKey(new Date())),
    [transactions]
  );
  const spent = currentMonthTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const spentTotals = useMemo(() => buildCategoryTotals(currentMonthTransactions), [currentMonthTransactions]);
  const normalizedLimits = useMemo(() => normalizeLimits(categoryLimitDrafts), [categoryLimitDrafts]);
  const totalCategoryLimits = Object.values(normalizedLimits).reduce((sum, value) => sum + value, 0);
  const hasMonthlyPlan = settings.monthly_allowance > 0;
  const remaining = settings.monthly_allowance - spent;
  const usedPercent = hasMonthlyPlan ? Math.min(100, (spent / settings.monthly_allowance) * 100) : 0;
  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN')}`;

  const saveBudget = () => {
    const nextAllowance = Number(allowance);
    const nextResetDay = Number(resetDay);
    if (!Number.isFinite(nextAllowance) || nextAllowance < 0) {
      setBudgetNotice({ tone: 'danger', title: 'Invalid budget', body: 'Enter a valid monthly allowance.' });
      return;
    }
    if (!Number.isInteger(nextResetDay) || nextResetDay < 1 || nextResetDay > 31) {
      setBudgetNotice({ tone: 'danger', title: 'Invalid reset day', body: 'Reset day must be between 1 and 31.' });
      return;
    }

    updateSettings({
      monthly_allowance: nextAllowance,
      reset_day: nextResetDay,
      currency: settings.currency,
      category_limits: normalizedLimits,
    });
    setBudgetNotice({ tone: 'primary', title: 'Budget saved', body: 'Your budget settings and category limits were saved.' });
  };

  const saveAdjustment = (type: 'add' | 'subtract') => {
    const numericAmount = Number(adjustmentAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setBudgetNotice({ tone: 'danger', title: 'Invalid adjustment', body: 'Enter an amount greater than zero.' });
      return;
    }

    addAdjustment({
      amount: numericAmount,
      type,
      reason: adjustmentReason.trim() || 'Manual adjustment',
      date: new Date().toISOString(),
    });
    setAllowance(String(type === 'add' ? settings.monthly_allowance + numericAmount : settings.monthly_allowance - numericAmount));
    setAdjustmentAmount('');
    setAdjustmentReason('');
    setBudgetNotice({ tone: 'primary', title: 'Adjustment added', body: 'Your monthly allowance draft has been updated.' });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Spacing.xl }]} keyboardShouldPersistTaps="handled">
        <CenteredPageHeader title="Budget" leftAction={<ScreenBackButton compact />} />

        {budgetNotice && (
          <ScreenState
            body={budgetNotice.body}
            icon={budgetNotice.tone === 'danger' ? 'alert-circle-outline' : 'check-circle-outline'}
            style={{ marginBottom: Spacing.base, padding: Spacing.base }}
            title={budgetNotice.title}
            tone={budgetNotice.tone}
          />
        )}

        <View style={styles.panel}>
          {hasMonthlyPlan ? (
            <>
              <Text style={styles.muted}>{remaining < 0 ? 'Over your plan' : 'Available to spend'}</Text>
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.value, { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], marginTop: Spacing.xs }]}
              >
                {formatMoney(Math.abs(remaining))}
              </Text>
              <View
                accessibilityLabel={`${Math.round((spent / settings.monthly_allowance) * 100)} percent of monthly allowance spent`}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(usedPercent) }}
                style={{ backgroundColor: colors.borderLight, borderRadius: BorderRadius.full, height: 6, marginTop: Spacing.lg, overflow: 'hidden' }}
              >
                <View style={{ backgroundColor: colors.textPrimary, borderRadius: BorderRadius.full, height: 6, width: `${usedPercent}%` }} />
              </View>
              <View style={[styles.row, { marginTop: Spacing.sm }]}>
                <Text style={styles.muted}>Spent {formatMoney(spent)}</Text>
                <Text style={styles.muted}>Plan {formatMoney(settings.monthly_allowance)}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.value, { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg }]}>Start with a monthly allowance</Text>
              <Text style={[styles.muted, { lineHeight: 20, marginTop: Spacing.sm }]}>Set an amount below to see what is available to spend. Your recorded spending stays intact.</Text>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.muted}>Spent this month</Text>
                <Text style={styles.value}>{formatMoney(spent)}</Text>
              </View>
            </>
          )}
        </View>

        <Disclosure
          title="Monthly allowance"
          summary={hasMonthlyPlan ? `${formatMoney(settings.monthly_allowance)} per month` : 'Set your plan to see what remains'}
          defaultOpen={!hasMonthlyPlan}
        >
        <View style={styles.panel}>
          <Input
            label="Monthly allowance"
            value={allowance}
            onChangeText={setAllowance}
            placeholder="0"
            keyboardType="decimal-pad"
            inputMode="decimal"
            icon="wallet-outline"
          />
          <Disclosure title="Reset & carry forward" summary="Monthly schedule and safeguards">
          <Input
            label="Reset day"
            value={resetDay}
            onChangeText={setResetDay}
            placeholder="1"
            keyboardType="number-pad"
            icon="calendar-refresh"
          />
          <View style={[styles.row, { marginBottom: Spacing.md }]}>
            <Text style={styles.muted}>Auto reset monthly</Text>
            <Switch
              value={settings.auto_reset}
              onValueChange={(auto_reset) => updateSettings({ auto_reset })}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={settings.auto_reset ? colors.primary : colors.textTertiary}
            />
          </View>
          <View style={[styles.row, { marginBottom: Spacing.md }]}>
            <Text style={styles.muted}>Carry forward unused balance</Text>
            <Switch
              value={settings.carry_forward}
              onValueChange={(carry_forward) => updateSettings({ carry_forward })}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={settings.carry_forward ? colors.primary : colors.textTertiary}
            />
          </View>
          <View style={[styles.row, { marginBottom: Spacing.md }]}>
            <Text style={styles.muted}>Emergency mode</Text>
            <Switch
              value={isEmergencyMode}
              onValueChange={toggleEmergencyMode}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={isEmergencyMode ? colors.primary : colors.textTertiary}
            />
          </View>
          </Disclosure>
          <Button title="Save budget" onPress={saveBudget} />
        </View>
        </Disclosure>

        <Disclosure title="Category limits" summary={Object.keys(normalizedLimits).length ? `${Object.keys(normalizedLimits).length} limits · ${formatMoney(totalCategoryLimits)} planned` : 'Optional limits for individual categories'}>
        <View style={styles.panel}>
          {spentTotals.length > 0 ? <BudgetSpendingPieChart spentTotals={spentTotals} formatMoney={formatMoney} /> : null}
          <Text style={[styles.muted, { marginBottom: Spacing.md }]}>
            Set a ceiling for any category. Leave a field empty for no limit.
          </Text>
          <View style={{ gap: Spacing.sm }}>
            {EXPENSE_CATEGORIES.map((category, index) => {
              const spentAmount = spentTotals.find((item) => item.category === category.id)?.total ?? 0;
              const limitAmount = normalizedLimits[category.id] ?? 0;
              const percentUsed = limitAmount > 0 ? Math.min(100, Math.round((spentAmount / limitAmount) * 100)) : 0;

              return (
                <Animated.View
                  key={category.id}
                  entering={FadeInDown.delay(index * 18).duration(220)}
                  layout={Layout.springify()}
                  style={{
                    borderColor: colors.borderLight,
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    padding: Spacing.md,
                  }}
                >
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.md }}>
                    <View
                      style={{
                        alignItems: 'center',
                        backgroundColor: colors.primaryBg,
                        borderRadius: BorderRadius.md,
                        height: 42,
                        justifyContent: 'center',
                        width: 42,
                      }}
                    >
                      <MaterialCommunityIcons name={category.icon} size={21} color={colors.primaryDark} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base }}>
                        {category.name}
                      </Text>
                      <Text style={styles.muted} numberOfLines={1}>
                        {limitAmount > 0 ? `${formatMoney(spentAmount)} used - ${percentUsed}%` : `${formatMoney(spentAmount)} spent this month`}
                      </Text>
                    </View>
                    <View
                      style={{
                        alignItems: 'center',
                        borderColor: colors.border,
                        borderRadius: BorderRadius.md,
                        borderWidth: 1,
                        flexDirection: 'row',
                        minHeight: 44,
                        paddingHorizontal: Spacing.sm,
                        width: 112,
                      }}
                    >
                      <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.bold, marginRight: 4 }}>{currencySymbol}</Text>
                      <TextInput
                        accessibilityLabel={`${category.name} limit`}
                        value={categoryLimitDrafts[category.id] ?? ''}
                        onChangeText={(value) => setCategoryLimitDrafts((current) => ({ ...current, [category.id]: value.replace(/[^0-9.]/g, '') }))}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        placeholder="0"
                        placeholderTextColor={colors.textTertiary}
                        style={{
                          color: colors.textPrimary,
                          flex: 1,
                          fontFamily: Typography.fontFamily.semiBold,
                          fontSize: Typography.fontSize.base,
                          paddingVertical: 8,
                        }}
                      />
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
          <Button title="Save category limits" onPress={saveBudget} style={{ marginTop: Spacing.base }} />
        </View>

        </Disclosure>

        <Disclosure title="Adjust this month" summary="One-off changes and recent adjustments">
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Manual adjustment</Text>
          <Input
            label="Amount"
            value={adjustmentAmount}
            onChangeText={setAdjustmentAmount}
            placeholder="0"
            keyboardType="decimal-pad"
            inputMode="decimal"
            icon="plus-minus"
          />
          <Input
            label="Reason"
            value={adjustmentReason}
            onChangeText={setAdjustmentReason}
            placeholder="Reason for adjustment"
            icon="note-text-outline"
          />
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <Button title="Add" onPress={() => saveAdjustment('add')} variant="secondary" style={{ flex: 1 }} />
            <Button title="Subtract" onPress={() => saveAdjustment('subtract')} variant="outline" style={{ flex: 1 }} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent adjustments</Text>
        {adjustments.length === 0 ? (
          <View style={styles.panel}>
            <Text style={styles.emptyText}>No manual adjustments yet. Add one when your monthly allowance changes mid-cycle.</Text>
          </View>
        ) : (
          adjustments.slice(0, 4).map((item) => (
            <View key={`${item.date}-${item.reason}`} style={styles.panel}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.value} numberOfLines={1}>{item.reason}</Text>
                  <Text style={styles.muted}>{new Date(item.date).toLocaleDateString('en-IN')}</Text>
                </View>
                <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
                  {item.type === 'add' ? '+' : '-'}
                  {formatMoney(item.amount)}
                </Text>
              </View>
            </View>
          ))
        )}
        </Disclosure>
      </ScrollView>
    </SafeAreaView>
  );
}
