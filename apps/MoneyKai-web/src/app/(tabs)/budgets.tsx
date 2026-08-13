import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { BudgetHealth } from '@/components/dashboard/BudgetHealth';
import { BudgetCoachPanel } from '@/components/budgets/BudgetCoachPanel';
import { MonthlyReset } from '@/components/dashboard/MonthlyReset';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';
import { getCategoryById } from '@/constants/categories';
import { useReportingMonth } from '@/components/layout/ReportingMonthContext';
import { ReportingMonthPicker } from '@/components/layout/ReportingMonthPicker';
import { buildCashflowPlan } from '@/utils/cashflowPlan';
import { withAlpha } from '@/utils/glassStyle';

export function LegacyBudgetsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { settings, adjustments } = useBudgetStore();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const allowance = settings.monthly_allowance;
  const remaining = allowance - totalSpent;
  const usage = allowance > 0 ? Math.min(100, (totalSpent / allowance) * 100) : 0;
  const recentAdjustments = useMemo(() => adjustments.slice(0, 6), [adjustments]);
  const isWide = width >= 1100;
  const budgetReview = allowance <= 0
    ? {
        label: 'Needs setup',
        tone: colors.warning,
        icon: 'alert-circle-outline' as const,
        body: 'Set a monthly limit before MoneyKai can judge budget pressure.',
        action: 'Open Settings',
      }
    : remaining < 0
      ? {
          label: 'Over limit',
          tone: colors.emergency,
          icon: 'alert-octagon-outline' as const,
          body: `${formatCurrency(Math.abs(remaining))} above the current monthly budget. Review recent transactions before adjusting the limit.`,
          action: 'Review Transactions',
        }
      : usage >= 80
        ? {
            label: 'Watch closely',
            tone: colors.warning,
            icon: 'alert-circle-outline' as const,
            body: `${Math.round(usage)}% of the monthly budget is used. Check categories before approving more spend.`,
            action: 'Review Transactions',
          }
        : {
            label: 'On track',
            tone: colors.primary,
            icon: 'shield-check-outline' as const,
            body: `${formatCurrency(Math.max(0, remaining))} remains. Keep the current plan unless new records change the picture.`,
            action: 'Open Transactions',
          };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['4xl'] }}
      >
        <View style={{ gap: Spacing.xl }}>
          <Card>
            <ProgressBar progress={usage} showLabel label="Budget usage" height={10} />
          </Card>

          <Card style={{ gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: `${budgetReview.tone}14` }}>
                <MaterialCommunityIcons name={budgetReview.icon} size={20} color={budgetReview.tone} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                  BUDGET REVIEW
                </Text>
                <Text style={{ marginTop: 3, fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {budgetReview.label}
                </Text>
                <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, lineHeight: 21, color: colors.textSecondary }}>
                  {budgetReview.body}
                </Text>
              </View>
              <Button title={budgetReview.action} size="sm" variant="outline" icon="arrow-right" iconPosition="right" onPress={() => router.push(budgetReview.action.includes('Settings') ? '/settings' as any : '/transactions' as any)} />
            </View>
          </Card>

          <View style={{ gap: Spacing.xl }}>
            <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.xl, alignItems: 'stretch' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <BudgetHealth />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <MonthlyReset />
              </View>
            </View>

            <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.xl, alignItems: 'stretch' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <BudgetCoachPanel />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
              <Card>
                <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>
                  Budget adjustments
                </Text>
                {recentAdjustments.length > 0 ? (
                  <View style={{ gap: 10 }}>
                    {recentAdjustments.map((adjustment) => (
                      <View
                        key={adjustment.date}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 10,
                          borderTopWidth: 1,
                          borderTopColor: colors.borderLight,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                            {adjustment.reason}
                          </Text>
                          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
                            {formatDate(adjustment.date, 'dd MMM yyyy')}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: adjustment.type === 'add' ? colors.primary : colors.emergency }}>
                            {adjustment.type === 'add' ? '+' : '-'}{formatCurrency(adjustment.amount)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    icon="cash-plus"
                    title="No budget adjustments yet"
                    message="Adjustments will appear here after you add or subtract from the monthly budget."
                    action={<Button title="Open Settings" onPress={() => router.push('/settings' as any)} />}
                    style={{ paddingVertical: Spacing.xl }}
                  />
                )}
              </Card>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const toMonthDate = (selectedMonthDate: Date) => ({
  start: new Date(Date.UTC(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), 1)),
  end: new Date(Date.UTC(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 1)),
});

const humanizeCategory = (value: string) => value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { selectedMonthDate } = useReportingMonth();
  const transactions = useTransactionStore((state) => state.transactions);
  const challenges = useChallengeStore((state) => state.challenges);
  const settings = useBudgetStore((state) => state.settings);
  const adjustments = useBudgetStore((state) => state.adjustments);
  const addAdjustment = useBudgetStore((state) => state.addAdjustment);
  const updateSettings = useBudgetStore((state) => state.updateSettings);
  const [adjustmentMode, setAdjustmentMode] = useState<'add' | 'subtract'>('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const amountInputRef = useRef<TextInput>(null);
  const isWide = width >= 1120;
  const isCompact = width < 760;
  const { start: cycleStart, end: cycleEnd } = toMonthDate(selectedMonthDate);
  const now = new Date();
  const reportingNow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
  const cycleStartMs = cycleStart.getTime();
  const cycleEndMs = cycleEnd.getTime();
  const reportingNowMs = reportingNow.getTime();
  const plan = buildCashflowPlan({
    transactions,
    monthlyAllowance: settings.monthly_allowance,
    challenges,
    cycleStart: new Date(cycleStartMs),
    cycleEnd: new Date(cycleEndMs),
    now: new Date(reportingNowMs),
  });

  const allowance = settings.monthly_allowance;
  const spent = plan.metrics.actualExpense;
  const available = plan.metrics.budgetAvailable;
  const usage = allowance > 0 ? Math.max(0, (spent / allowance) * 100) : 0;
  const selectedMonthIsCurrent = selectedMonthDate.getFullYear() === now.getFullYear() && selectedMonthDate.getMonth() === now.getMonth();
  const remainingDays = selectedMonthIsCurrent
    ? Math.max(1, Math.ceil((cycleEnd.getTime() - reportingNow.getTime()) / (24 * 60 * 60 * 1_000)))
    : Math.max(1, Math.round((cycleEnd.getTime() - cycleStart.getTime()) / (24 * 60 * 60 * 1_000)));
  const dailySafeToSpend = allowance > 0 ? Math.max(0, plan.metrics.safeToSpend / remainingDays) : 0;
  const visibleCategories = plan.categories.slice(0, 6);
  const recentAdjustments = adjustments.slice(0, 6);
  const resultingBudgets = useMemo(() => {
    return recentAdjustments.reduce<{ runningBudget: number; results: number[] }>((accumulator, adjustment) => ({
      results: [...accumulator.results, accumulator.runningBudget],
      runningBudget: adjustment.type === 'add'
        ? accumulator.runningBudget - Number(adjustment.amount)
        : accumulator.runningBudget + Number(adjustment.amount),
    }), { runningBudget: allowance, results: [] }).results;
  }, [allowance, recentAdjustments]);

  const submitAdjustment = () => {
    const amount = Number(adjustmentAmount.replace(/,/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      amountInputRef.current?.focus();
      return;
    }

    addAdjustment({
      amount,
      type: adjustmentMode,
      reason: 'Manual budget adjustment',
      date: new Date().toISOString(),
    });
    setAdjustmentAmount('');
  };

  const metrics = [
    { label: 'Monthly budget', value: allowance > 0 ? formatCurrency(allowance) : 'Not set', detail: 'Total planned for the month', color: allowance > 0 ? colors.success : colors.textTertiary },
    { label: 'Spent', value: formatCurrency(spent), detail: allowance > 0 ? `${Math.round(usage)}% of budget used` : 'From reviewed expenses', color: colors.warning },
    { label: 'Available', value: allowance > 0 ? formatCurrency(available) : 'Not set', detail: 'Left to spend this month', color: available < 0 ? colors.error : colors.success },
    { label: 'Daily safe-to-spend', value: allowance > 0 ? formatCurrency(dailySafeToSpend) : 'Not set', detail: `For the remaining ${remainingDays} days`, color: colors.info },
  ];

  const planningSteps = [
    {
      icon: 'wallet-outline' as const,
      title: 'Monthly allowance',
      detail: allowance > 0 ? `${formatCurrency(allowance)} is active for this month.` : 'Set the amount you want this month to stay within.',
      status: allowance > 0 ? 'Ready' : 'Required',
      tone: allowance > 0 ? colors.success : colors.warning,
      action: 'budget' as const,
    },
    {
      icon: 'shape-outline' as const,
      title: 'Category structure',
      detail: visibleCategories.length > 0 ? `${visibleCategories.length} spending categories have reviewed activity.` : 'Organise categories before setting detailed guardrails.',
      status: visibleCategories.length > 0 ? 'Review' : 'Set up',
      tone: visibleCategories.length > 0 ? colors.info : colors.textTertiary,
      action: 'categories' as const,
    },
    {
      icon: 'calendar-sync-outline' as const,
      title: 'Monthly reset',
      detail: settings.auto_reset ? `Renews automatically on day ${settings.reset_day}.` : 'Carry the plan forward manually each month.',
      status: settings.auto_reset ? 'On' : 'Off',
      tone: settings.auto_reset ? colors.success : colors.textTertiary,
      action: 'settings' as const,
    },
  ];

  return (
    <ScrollView
      testID="budgets-workspace"
      showsVerticalScrollIndicator
      contentContainerStyle={{ gap: Spacing.md, paddingBottom: insets.bottom + Spacing.xl }}
    >
      <View style={[budgetStyles.header, { flexDirection: isCompact ? 'column' : 'row', alignItems: isCompact ? 'stretch' : 'flex-start' }]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text accessibilityRole="header" style={[budgetStyles.pageTitle, { color: colors.textPrimary }]}>Budgets</Text>
          <Text style={[budgetStyles.pageSubtitle, { color: colors.textSecondary }]}>Set the limits and reset rules that shape your monthly plan.</Text>
        </View>
        <View style={[budgetStyles.headerActions, { justifyContent: isCompact ? 'flex-start' : 'flex-end' }]}>
          <ReportingMonthPicker compact />
          <Button title="Add category" icon="plus" variant="outline" size="sm" onPress={() => router.push('/categories' as any)} />
          <Button title="Adjust budget" icon="tune-variant" variant="outline" size="sm" onPress={() => amountInputRef.current?.focus()} />
        </View>
      </View>

      <View style={[budgetStyles.metricStrip, { borderColor: colors.borderLight, backgroundColor: colors.card }]}>
        {metrics.map((metric, index) => (
          <View
            key={metric.label}
            accessible
            accessibilityLabel={`${metric.label}: ${metric.value}. ${metric.detail}`}
            style={[
              budgetStyles.metricCell,
              {
                width: isCompact ? (width < 480 ? '100%' : '50%') : '25%',
                borderColor: colors.borderLight,
                borderRightWidth: !isCompact && index < metrics.length - 1 ? 1 : 0,
                borderBottomWidth: isCompact && index < metrics.length - (width < 480 ? 1 : 2) ? 1 : 0,
              },
            ]}
          >
            <Text style={[budgetStyles.metricLabel, { color: colors.textSecondary }]}>{metric.label}</Text>
            <Text style={[budgetStyles.metricValue, { color: metric.color }]} numberOfLines={1}>{metric.value}</Text>
            <Text style={[budgetStyles.metricDetail, { color: colors.textTertiary }]} numberOfLines={1}>{metric.detail}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
        <View style={{ flex: 2, minWidth: 0 }}>
          <Card variant="glass" style={budgetStyles.fillCard}>
            <View style={budgetStyles.cardHeader}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text accessibilityRole="header" style={[budgetStyles.cardTitle, { color: colors.textPrimary }]}>Budget by category</Text>
                <Text style={[budgetStyles.cardCaption, { color: colors.textTertiary }]}>Bars show each category’s share of actual spending.</Text>
              </View>
              <Button title="View details" variant="ghost" size="sm" onPress={() => router.push('/reports' as any)} />
            </View>

            <View style={[budgetStyles.categoryHeader, { borderBottomColor: colors.borderLight }]}>
              <Text style={[budgetStyles.tableHeader, { flex: 1.1, color: colors.textTertiary }]}>Category</Text>
              <Text style={[budgetStyles.tableHeader, { flex: 0.8, color: colors.textTertiary }]}>Spent</Text>
              <Text style={[budgetStyles.tableHeader, { flex: 0.45, color: colors.textTertiary }]}>Share</Text>
              <Text style={[budgetStyles.tableHeader, { flex: 1.2, color: colors.textTertiary }]}>Monthly mix</Text>
            </View>

            {visibleCategories.length > 0 ? visibleCategories.map((category, index) => {
              const categoryMeta = getCategoryById(category.category);
              const categoryLabel = categoryMeta?.name ?? humanizeCategory(category.category);
              const categoryTone = [colors.success, colors.info, colors.warning, colors.chart2][index % 4];
              return (
                <View key={category.category} style={[budgetStyles.categoryRow, index > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderLight } : null]}>
                  <View style={budgetStyles.categoryName}>
                    <MaterialCommunityIcons name={(categoryMeta?.icon ?? 'shape-outline') as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color={colors.textSecondary} />
                    <Text style={[budgetStyles.categoryText, { color: colors.textPrimary }]} numberOfLines={1}>{categoryLabel}</Text>
                  </View>
                  <Text style={[budgetStyles.categoryAmount, { color: colors.textSecondary }]} numberOfLines={1}>{formatCurrency(category.total)}</Text>
                  <Text style={[budgetStyles.categoryShare, { color: colors.textSecondary }]}>{Math.round(category.percentage)}%</Text>
                  <View style={[budgetStyles.categoryTrack, { backgroundColor: colors.borderLight }]}>
                    <View style={[budgetStyles.categoryFill, { width: `${Math.min(100, category.percentage)}%`, backgroundColor: categoryTone }]} />
                  </View>
                </View>
              );
            }) : (
              <View style={budgetStyles.categorySetup}>
                <View style={[budgetStyles.categorySetupIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <MaterialCommunityIcons name="shape-plus-outline" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[budgetStyles.categorySetupTitle, { color: colors.textPrimary }]}>Create your category structure</Text>
                  <Text style={[budgetStyles.categorySetupBody, { color: colors.textSecondary }]}>Categories turn one monthly limit into useful spending guardrails. Add the categories you actually use; reviewed expenses will fill the evidence column automatically.</Text>
                </View>
                <Button title="Add category" icon="plus" size="sm" onPress={() => router.push('/categories' as any)} />
              </View>
            )}
          </Card>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Card variant="glass" style={budgetStyles.fillCard}>
            <View style={budgetStyles.cardHeader}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text accessibilityRole="header" style={[budgetStyles.cardTitle, { color: colors.textPrimary }]}>Planning checklist</Text>
                <Text style={[budgetStyles.cardCaption, { color: colors.textTertiary }]}>Configuration belongs here. Live pressure stays on Dashboard.</Text>
              </View>
            </View>
            <View style={[budgetStyles.planningList, { borderTopColor: colors.borderLight }]}>
              {planningSteps.map((step, index) => (
                <Pressable
                  key={step.title}
                  accessibilityRole="button"
                  accessibilityLabel={`${step.title}: ${step.status}. ${step.detail}`}
                  onPress={() => {
                    if (step.action === 'budget') {
                      amountInputRef.current?.focus();
                      return;
                    }
                    router.push(step.action === 'categories' ? '/categories' as any : '/settings' as any);
                  }}
                  style={({ hovered }: any) => [
                    budgetStyles.planningRow,
                    index > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderLight } : null,
                    hovered ? { backgroundColor: colors.surfaceElevated } : null,
                  ]}
                >
                  <View style={[budgetStyles.planningIcon, { backgroundColor: withAlpha(step.tone, 0.12) }]}>
                    <MaterialCommunityIcons name={step.icon} size={19} color={step.tone} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[budgetStyles.planningTitle, { color: colors.textPrimary }]}>{step.title}</Text>
                    <Text style={[budgetStyles.planningDetail, { color: colors.textSecondary }]}>{step.detail}</Text>
                  </View>
                  <Text style={[budgetStyles.planningStatus, { color: step.tone }]}>{step.status}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
                </Pressable>
              ))}
            </View>
          </Card>
        </View>
      </View>

      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
        <View style={{ flex: 2, minWidth: 0 }}>
          <Card variant="glass" style={budgetStyles.fillCard}>
            <Text accessibilityRole="header" style={[budgetStyles.cardTitle, { color: colors.textPrimary }]}>Monthly adjustment</Text>
            <View style={[budgetStyles.adjustmentLayout, { flexDirection: isCompact ? 'column' : 'row' }]}>
              <View style={[budgetStyles.currentAllowance, { borderRightWidth: isCompact ? 0 : 1, borderRightColor: colors.borderLight }]}>
                <Text style={[budgetStyles.metricLabel, { color: colors.textSecondary }]}>Current allowance</Text>
                <Text style={[budgetStyles.adjustmentTotal, { color: allowance > 0 ? colors.success : colors.textTertiary }]}>{allowance > 0 ? formatCurrency(allowance) : 'Not set'}</Text>
                <Text style={[budgetStyles.metricDetail, { color: colors.textTertiary }]}>{allowance > 0 ? `${formatCurrency(Math.max(0, available))} left this month` : 'Add your first monthly limit'}</Text>
              </View>
              <View style={budgetStyles.adjustmentForm}>
                <Text style={[budgetStyles.metricLabel, { color: colors.textSecondary }]}>Adjust budget for this month</Text>
                <View style={budgetStyles.amountRow}>
                  <View style={[budgetStyles.amountInputWrap, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[budgetStyles.currencyPrefix, { color: colors.textPrimary }]}>₹</Text>
                    <TextInput
                      ref={amountInputRef}
                      accessibilityLabel="Budget adjustment amount"
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                      value={adjustmentAmount}
                      onChangeText={setAdjustmentAmount}
                      onSubmitEditing={submitAdjustment}
                      style={[budgetStyles.amountInput, { color: colors.textPrimary }]}
                    />
                  </View>
                  <View style={[budgetStyles.segmented, { borderColor: colors.borderLight }]}>
                    {(['add', 'subtract'] as const).map((mode) => (
                      <Pressable
                        key={mode}
                        accessibilityRole="button"
                        accessibilityState={{ selected: adjustmentMode === mode }}
                        onPress={() => setAdjustmentMode(mode)}
                        style={[budgetStyles.segment, adjustmentMode === mode ? { backgroundColor: colors.primaryBg } : null]}
                      >
                        <Text style={[budgetStyles.segmentText, { color: adjustmentMode === mode ? colors.primary : colors.textSecondary }]}>{mode === 'add' ? '+ Add' : '− Sub'}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Button title="Update budget" variant="outline" onPress={submitAdjustment} />
              </View>
            </View>
          </Card>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Card variant="glass" style={budgetStyles.fillCard}>
            <View style={budgetStyles.cardHeader}>
              <Text accessibilityRole="header" style={[budgetStyles.cardTitle, { color: colors.textPrimary }]}>Smart monthly reset</Text>
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.textTertiary} />
            </View>
            <View style={budgetStyles.resetRow}>
              <View style={[budgetStyles.resetIcon, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}>
                <MaterialCommunityIcons name="calendar-sync-outline" size={22} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={budgetStyles.resetTitleRow}>
                  <Text style={[budgetStyles.resetTitle, { color: colors.textPrimary }]}>Auto reset</Text>
                  <Text style={[budgetStyles.resetBadge, { color: settings.auto_reset ? colors.success : colors.textTertiary }]}>{settings.auto_reset ? 'On' : 'Off'}</Text>
                </View>
                <Text style={[budgetStyles.metricDetail, { color: colors.textTertiary }]}>Reset on day {settings.reset_day} of each month</Text>
              </View>
              <Switch
                accessibilityLabel="Auto reset monthly budget"
                value={settings.auto_reset}
                onValueChange={(autoReset) => updateSettings({ auto_reset: autoReset })}
                trackColor={{ false: colors.borderLight, true: withAlpha(colors.success, 0.34) }}
                thumbColor={settings.auto_reset ? colors.success : colors.textTertiary}
                ios_backgroundColor={colors.borderLight}
                style={{ transform: [{ scaleX: 0.84 }, { scaleY: 0.84 }] }}
              />
            </View>
            <Button title="Manage in settings" variant="ghost" size="sm" icon="arrow-right" iconPosition="right" onPress={() => router.push('/settings' as any)} style={{ alignSelf: 'flex-start', marginTop: Spacing.md }} />
          </Card>
        </View>
      </View>

      <Card variant="glass">
        <View style={budgetStyles.cardHeader}>
          <Text accessibilityRole="header" style={[budgetStyles.cardTitle, { color: colors.textPrimary }]}>Budget adjustments</Text>
          <Button title="View settings" variant="ghost" size="sm" onPress={() => router.push('/settings' as any)} />
        </View>
        {recentAdjustments.length > 0 ? (
          <View accessibilityRole="list" style={{ marginTop: Spacing.sm }}>
            <View style={[budgetStyles.adjustmentTableRow, { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
              {['Date', 'Change', 'Reason', 'Resulting budget', 'Status'].map((label, index) => (
                <Text key={label} style={[budgetStyles.adjustmentHeader, { color: colors.textTertiary, flex: index === 2 ? 1.8 : 1 }]}>{label}</Text>
              ))}
            </View>
            {recentAdjustments.map((adjustment, index) => (
              <View key={`${adjustment.date}-${index}`} accessibilityRole="summary" style={[budgetStyles.adjustmentTableRow, index > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderLight } : null]}>
                <Text style={[budgetStyles.adjustmentCell, { color: colors.textSecondary }]} numberOfLines={1}>{formatDate(adjustment.date, 'dd MMM yyyy')}</Text>
                <Text style={[budgetStyles.adjustmentCell, { color: adjustment.type === 'add' ? colors.success : colors.error, fontFamily: Typography.fontFamily.semiBold }]} numberOfLines={1}>{adjustment.type === 'add' ? '+' : '−'}{formatCurrency(adjustment.amount)}</Text>
                <Text style={[budgetStyles.adjustmentCell, { color: colors.textSecondary, flex: 1.8 }]} numberOfLines={1}>{adjustment.reason}</Text>
                <Text style={[budgetStyles.adjustmentCell, { color: colors.textPrimary }]} numberOfLines={1}>{formatCurrency(resultingBudgets[index])}</Text>
                <View style={budgetStyles.adjustmentStatus}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success} />
                  <Text numberOfLines={1} style={[budgetStyles.adjustmentStatusText, { color: colors.success }]}>Applied</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[budgetStyles.emptyAdjustment, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
            <View style={[budgetStyles.emptyAdjustmentIcon, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <MaterialCommunityIcons name="history" size={22} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[budgetStyles.emptyAdjustmentTitle, { color: colors.textPrimary }]}>No changes this month</Text>
              <Text style={[budgetStyles.emptyAdjustmentBody, { color: colors.textSecondary }]}>Your current allowance is the original plan. Adjust it above only when the plan itself changes.</Text>
            </View>
            <Button title="Adjust now" variant="ghost" size="sm" onPress={() => amountInputRef.current?.focus()} />
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const budgetStyles = StyleSheet.create({
  header: { position: 'relative', zIndex: 70, gap: Spacing.md, justifyContent: 'space-between' },
  pageTitle: { fontSize: Typography.fontSize['3xl'], lineHeight: Typography.lineHeight['3xl'], fontFamily: Typography.fontFamily.display },
  pageSubtitle: { marginTop: 4, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  metricStrip: { position: 'relative', zIndex: 0, flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  metricCell: { minWidth: 0, paddingHorizontal: Spacing.lg, paddingVertical: 14 },
  metricLabel: { fontSize: Typography.fontSize.xs, lineHeight: Typography.lineHeight.xs, fontFamily: Typography.fontFamily.medium },
  metricValue: { marginTop: Spacing.xs, fontSize: Typography.fontSize.lg, lineHeight: Typography.lineHeight.lg, fontFamily: Typography.fontFamily.semiBold },
  metricDetail: { marginTop: 3, fontSize: 11, lineHeight: 15 },
  fillCard: { minWidth: 0 },
  cardHeader: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  cardTitle: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.md, lineHeight: Typography.lineHeight.md, fontFamily: Typography.fontFamily.semiBold },
  cardCaption: { marginTop: 2, fontSize: 11 },
  categoryHeader: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderBottomWidth: 1 },
  tableHeader: { minWidth: 0, fontSize: 10, lineHeight: 14, fontFamily: Typography.fontFamily.medium },
  categoryRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  categoryName: { flex: 1.1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryText: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium },
  categoryAmount: { flex: 0.8, minWidth: 0, fontSize: Typography.fontSize.xs },
  categoryShare: { flex: 0.45, minWidth: 0, fontSize: Typography.fontSize.xs },
  categoryTrack: { flex: 1.2, height: 7, borderRadius: BorderRadius.full, overflow: 'hidden' },
  categoryFill: { height: '100%', borderRadius: BorderRadius.full },
  categorySetup: { minHeight: 148, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  categorySetupIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  categorySetupTitle: { fontSize: Typography.fontSize.sm, lineHeight: 20, fontFamily: Typography.fontFamily.semiBold },
  categorySetupBody: { maxWidth: 600, marginTop: 4, fontSize: Typography.fontSize.xs, lineHeight: 18 },
  planningList: { marginTop: Spacing.md, borderTopWidth: 1 },
  planningRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm },
  planningIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  planningTitle: { fontSize: Typography.fontSize.sm, lineHeight: 20, fontFamily: Typography.fontFamily.semiBold },
  planningDetail: { marginTop: 2, fontSize: 11, lineHeight: 16 },
  planningStatus: { fontSize: 11, lineHeight: 16, fontFamily: Typography.fontFamily.semiBold },
  adjustmentLayout: { gap: Spacing.md, marginTop: Spacing.md },
  currentAllowance: { flex: 0.8, minWidth: 180, paddingRight: Spacing.md },
  adjustmentTotal: { marginTop: Spacing.xs, fontSize: Typography.fontSize.xl, lineHeight: Typography.lineHeight.xl, fontFamily: Typography.fontFamily.semiBold },
  adjustmentForm: { flex: 2, minWidth: 0, gap: Spacing.sm },
  amountRow: { flexDirection: 'row', alignItems: 'stretch', gap: Spacing.sm },
  amountInputWrap: { flex: 1, minWidth: 0, height: 44, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md },
  currencyPrefix: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold },
  amountInput: { flex: 1, minWidth: 0, height: '100%', marginLeft: Spacing.sm, fontSize: Typography.fontSize.base, outlineStyle: 'none' } as any,
  segmented: { height: 44, flexDirection: 'row', borderWidth: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  segment: { minWidth: 68, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.sm },
  segmentText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold },
  resetRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md },
  resetIcon: { width: 44, height: 44, borderWidth: 1, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  resetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  resetTitle: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold },
  resetBadge: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold },
  adjustmentTableRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  adjustmentHeader: { minWidth: 0, fontSize: 10, lineHeight: 14, fontFamily: Typography.fontFamily.medium },
  adjustmentCell: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.xs, lineHeight: 18 },
  adjustmentStatus: { width: 104, flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  adjustmentStatusText: { width: 62, fontSize: Typography.fontSize.xs, lineHeight: 18, fontFamily: Typography.fontFamily.medium },
  emptyAdjustment: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md, padding: Spacing.md, borderWidth: 1, borderRadius: BorderRadius.md },
  emptyAdjustmentIcon: { width: 40, height: 40, borderRadius: BorderRadius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyAdjustmentTitle: { fontSize: Typography.fontSize.sm, lineHeight: 20, fontFamily: Typography.fontFamily.semiBold },
  emptyAdjustmentBody: { marginTop: 3, fontSize: Typography.fontSize.xs, lineHeight: 18 },
});
