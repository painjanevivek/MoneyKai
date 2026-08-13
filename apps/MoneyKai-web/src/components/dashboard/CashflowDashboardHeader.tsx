import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { Spacing, Typography } from '@/constants/theme';
import { ReportingMonthPicker } from '@/components/layout/ReportingMonthPicker';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';

type CashflowDashboardHeaderProps = {
  onAddTransaction: () => void;
  onAdjustBudget: () => void;
};

export function CashflowDashboardHeader({
  onAddTransaction,
  onAdjustBudget,
}: CashflowDashboardHeaderProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 760;

  const controls = (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: isCompact ? 'flex-start' : 'flex-end',
        gap: Spacing.sm,
        flex: isCompact ? undefined : 1,
        minWidth: 0,
      }}
    >
      <View style={{ flexBasis: isCompact ? '100%' : undefined, flexGrow: isCompact ? 1 : 0, minWidth: 0 }}>
        <ReportingMonthPicker compact />
      </View>
      <Button
        title="Add transaction"
        icon="plus"
        variant="outline"
        size="sm"
        onPress={onAddTransaction}
        style={{ flexGrow: isCompact ? 1 : 0 }}
      />
      <Button
        title="Adjust budget"
        icon="tune-variant"
        variant="outline"
        size="sm"
        onPress={onAdjustBudget}
        style={{ flexGrow: isCompact ? 1 : 0 }}
      />
    </View>
  );

  return (
    <View
      testID="cashflow-dashboard-header"
      style={{
        gap: isCompact ? Spacing.md : Spacing.base,
        minWidth: 0,
        zIndex: 1,
      }}
    >
      <View
        style={{
          flexDirection: isCompact ? 'column' : 'row',
          alignItems: isCompact ? 'stretch' : 'flex-start',
          gap: isCompact ? Spacing.md : Spacing.lg,
          minWidth: 0,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, maxWidth: 680 }}>
          <Text
            accessibilityRole="header"
            style={{
              fontSize: isCompact ? Typography.fontSize['2xl'] : Typography.fontSize['3xl'],
              lineHeight: isCompact ? Typography.lineHeight['2xl'] : Typography.lineHeight['3xl'],
              fontFamily: Typography.fontFamily.display,
              color: colors.textPrimary,
            }}
          >
            Cashflow plan
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: Typography.fontSize.sm,
              lineHeight: Typography.lineHeight.base,
              color: colors.textSecondary,
            }}
          >
            Plan your month. Track income, bills, budgets, and savings goals.
          </Text>
        </View>
        {!isCompact ? controls : null}
      </View>
      {isCompact ? controls : null}
    </View>
  );
}
