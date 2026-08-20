import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';

export default function SavedReportsScreen() {
  const { colors } = useTheme();
  const transactions = useTransactionStore((state) => state.transactions);
  const summary = useMemo(
    () => transactions.reduce(
      (totals, transaction) => ({
        income: totals.income + (transaction.type === 'income' ? Number(transaction.amount) : 0),
        expense: totals.expense + (transaction.type === 'expense' ? Number(transaction.amount) : 0),
      }),
      { income: 0, expense: 0 }
    ),
    [transactions]
  );

  const hasReportData = transactions.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 160 }} showsVerticalScrollIndicator>
        <View style={{ paddingVertical: Spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: BorderRadius.md,
                backgroundColor: colors.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="folder-download-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                Saved reports & exports
              </Text>
              <Text style={{ marginTop: 2, fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                Keep finalized money summaries and export options in one place.
              </Text>
            </View>
          </View>
        </View>

        {hasReportData ? (
          <View style={{ marginTop: Spacing.lg, gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Available report summary
            </Text>
            <Card>
              <View style={{ gap: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View style={{ width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      Money summary
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                      Based on {transactions.length} transactions currently in your MoneyKai history.
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Income</Text>
                    <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.accent }}>
                      {formatCurrency(summary.income)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Expenses</Text>
                    <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.emergency }}>
                      {formatCurrency(summary.expense)}
                    </Text>
                  </View>
                </View>
                <ReportAction label="Open full reports" icon="chart-bar" onPress={() => router.push('/reports' as any)} />
              </View>
            </Card>
          </View>
        ) : (
          <View style={{ marginTop: Spacing.lg }}>
            <EmptyState
              icon="file-chart-outline"
              title="No saved reports yet"
              message="Add transactions or import a statement to start building report summaries."
              action={<ReportAction label="Open reports" icon="chart-bar" onPress={() => router.push('/reports' as any)} />}
              style={{ backgroundColor: colors.card }}
            />
          </View>
        )}

        <View style={{ marginTop: Spacing.lg, gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Exports
          </Text>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="tray-arrow-up" size={20} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Export transactions
                </Text>
                <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                  Download your transaction table as Word, Excel, or PDF.
                </Text>
              </View>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Open transaction export settings"
                onPress={() => router.push('/settings' as any)}
                style={({ hovered, pressed }: any) => ({
                  minHeight: 40,
                  justifyContent: 'center',
                  paddingHorizontal: Spacing.md,
                  borderRadius: BorderRadius.md,
                  backgroundColor: hovered ? colors.primaryLight : colors.primary,
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                  Export
                </Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReportAction({ label, icon, onPress }: { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered, pressed }: any) => ({
        minHeight: 42,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: hovered ? colors.primaryLight : colors.primary,
        transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
      })}
    >
      <MaterialCommunityIcons name={icon} size={18} color={colors.textInverse} />
      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>{label}</Text>
    </Pressable>
  );
}
