import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
};

export function PlaceholderScreen({ title, subtitle = 'This screen will be wired to the migrated MoneyKai feature in the next phase.' }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: Spacing.xl }}>
      <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: 28, textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: Spacing.md, textAlign: 'center' }}>
        {subtitle}
      </Text>
    </View>
  );
}
