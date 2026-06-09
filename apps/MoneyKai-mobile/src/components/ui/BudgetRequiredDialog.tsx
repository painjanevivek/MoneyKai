import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppDialog } from '@/components/ui/AppDialog';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

type BudgetRequiredDialogProps = {
  visible: boolean;
  message?: string;
  onCancel: () => void;
  onSetBudget: () => void;
};

export function BudgetRequiredDialog({
  visible,
  message = 'Set a monthly budget before adding, importing, or fetching transactions.',
  onCancel,
  onSetBudget,
}: BudgetRequiredDialogProps) {
  const { colors } = useTheme();

  return (
    <AppDialog
      visible={visible}
      eyebrow="Budget setup"
      title="Set Monthly Budget"
      message={message}
      icon="wallet-plus-outline"
      onRequestClose={onCancel}
      cancelAction={{ label: 'Not now', icon: 'close', onPress: onCancel }}
      confirmAction={{ label: 'Set budget', icon: 'arrow-right', onPress: onSetBudget }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: Spacing.sm,
          borderRadius: BorderRadius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderLight,
          padding: Spacing.md,
        }}
      >
        <MaterialCommunityIcons name="chart-donut" size={18} color={colors.textSecondary} />
        <Text
          style={{
            flex: 1,
            fontSize: Typography.fontSize.xs,
            lineHeight: Typography.lineHeight.sm,
            color: colors.textSecondary,
          }}
        >
          This keeps spending, remaining balance, and category limits accurate across the app.
        </Text>
      </View>
    </AppDialog>
  );
}

export default BudgetRequiredDialog;
