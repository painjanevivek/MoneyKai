import React from 'react';
import { View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  available: string;
  hasBudget: boolean;
  spent: string;
  onOpenBudget: () => void;
};

export function HomeBasicSummary({ available, hasBudget, spent, onOpenBudget }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: Spacing.sm, marginTop: Spacing.md }}>
      <View testID="available-spent-heading" style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.md }}>
        <Text style={{ flexShrink: 1, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md + 2 }}>Available to spend</Text>
        <Text accessibilityLabel={`${spent} spent this month`} style={{ flexShrink: 1, textAlign: 'right', color: colors.textSecondary, fontSize: Typography.fontSize.sm }}><Text style={{ fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{spent}</Text> spent this month</Text>
      </View>
      <PressableScale accessibilityRole="button" accessibilityLabel={hasBudget ? `${available} available to spend. Open budget details` : 'No monthly budget set. Open budget setup'} onPress={onOpenBudget}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['5xl'] + 8, letterSpacing: -1.4, marginTop: Spacing.sm }}>
          {hasBudget ? available : '—'}
        </Text>
      </PressableScale>
      <Text style={{ color: colors.textTertiary, fontSize: Typography.fontSize.sm, marginTop: Spacing.sm }}>Remaining recorded monthly budget, not your bank balance.</Text>
    </View>
  );
}
