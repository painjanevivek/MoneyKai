import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Spacing, TransactionDirectionColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { shouldStackHomeTransaction } from '@/utils/homeTransactionLayout';

type Props = { title: string; fullTitle?: string; detail: string; amount: string; income: boolean; last: boolean; onPress: () => void };

export function HomeTransactionRow({ title, fullTitle, detail, amount, income, last, onPress }: Props) {
  const { colors } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const stacked = shouldStackHomeTransaction(width, fontScale, amount);
  const amountText = <Text style={{ color: income ? TransactionDirectionColor.credit : TransactionDirectionColor.debit, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, marginTop: stacked ? Spacing.xs : 0 }}>{amount}</Text>;
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={`${fullTitle ?? title}, ${amount}, ${detail}`} accessibilityHint="Opens transaction details and actions to edit, split, or delete" onPress={onPress} pressedScale={0.99}>
      <View style={{ alignItems: 'center', borderBottomColor: colors.borderLight, borderBottomWidth: last ? 0 : 1, flexDirection: 'row', gap: Spacing.md, minHeight: 58, paddingVertical: Spacing.md }}>
        <AppIcon color={income ? TransactionDirectionColor.credit : TransactionDirectionColor.debit} name={income ? 'arrow-bottom-left' : 'arrow-top-right'} size={20} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md }}>{title}</Text>
          <Text style={{ color: colors.textTertiary, fontSize: Typography.fontSize.sm, marginTop: Spacing.xs }} numberOfLines={2}>{detail}</Text>
          {stacked ? amountText : null}
        </View>
        {!stacked ? amountText : null}
      </View>
    </PressableScale>
  );
}
