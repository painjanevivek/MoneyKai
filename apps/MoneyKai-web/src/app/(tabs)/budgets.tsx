import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
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

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, adjustments } = useBudgetStore();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const allowance = settings.monthly_allowance;
  const remaining = allowance - totalSpent;
  const usage = allowance > 0 ? Math.min(100, (totalSpent / allowance) * 100) : 0;
  const recentAdjustments = useMemo(() => adjustments.slice(0, 6), [adjustments]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['4xl'] }}
      >
        <View style={{ gap: Spacing.xl }}>
          <Card>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Budgets
            </Text>
            <Text style={{ marginTop: 6, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22, maxWidth: 760 }}>
              Review the monthly allowance currently driving your MoneyKai workspace, see how much has been spent, and adjust the reset flow when you need to.
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md }}>
              <View style={{ flex: 1, minWidth: 180, backgroundColor: colors.primaryBg, borderRadius: BorderRadius.md, padding: Spacing.md }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Monthly budget</Text>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                  {formatCurrency(allowance)}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 180, backgroundColor: colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: colors.borderLight }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Spent</Text>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                  {formatCurrency(totalSpent)}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 180, backgroundColor: colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: colors.borderLight }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Remaining</Text>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                  {formatCurrency(Math.max(0, remaining))}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: Spacing.md }}>
              <ProgressBar progress={usage} showLabel label="Budget usage" />
            </View>
          </Card>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xl, alignItems: 'flex-start' }}>
            <View style={{ flex: 1, minWidth: 360, gap: Spacing.xl }}>
              <BudgetHealth />
              <BudgetCoachPanel />
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

            <View style={{ flex: 1, minWidth: 360 }}>
              <MonthlyReset />
            </View>
          </View>

          <Card>
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
              Budget controls live in settings
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22 }}>
              MoneyKai keeps the actual budget editing flow inside Settings so the dashboard can stay calm while the data remains real and user-owned.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
