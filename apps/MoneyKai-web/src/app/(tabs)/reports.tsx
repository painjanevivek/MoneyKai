import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { CategoryBarChart } from '@/components/charts/CategoryBarChart';
import { BudgetHealth } from '@/components/dashboard/BudgetHealth';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { Typography, Spacing } from '@/constants/theme';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['4xl'] }}
      >
        <View style={{ gap: Spacing.xl }}>
          <Card>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Reports
            </Text>
            <Text style={{ marginTop: 6, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22, maxWidth: 760 }}>
              MoneyKai reports use the live transaction, budget, and category data already in the app. This page keeps the desktop layout clean while still showing real insights.
            </Text>
          </Card>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xl, alignItems: 'flex-start' }}>
            <View style={{ flex: 2, minWidth: 420, gap: Spacing.xl }}>
              <TrendLineChart />
              <CategoryBarChart />
            </View>
            <View style={{ flex: 1, minWidth: 320, gap: Spacing.xl }}>
              <BudgetHealth />
              <AIInsights />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
