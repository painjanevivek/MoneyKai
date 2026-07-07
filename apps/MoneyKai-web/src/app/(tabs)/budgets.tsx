import React, { useMemo } from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
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
import { Typography, Spacing } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { settings, adjustments } = useBudgetStore();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const allowance = settings.monthly_allowance;
  const usage = allowance > 0 ? Math.min(100, (totalSpent / allowance) * 100) : 0;
  const recentAdjustments = useMemo(() => adjustments.slice(0, 6), [adjustments]);
  const isWide = width >= 1100;

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
