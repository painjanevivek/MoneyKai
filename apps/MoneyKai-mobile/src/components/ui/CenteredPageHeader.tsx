import React, { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type CenteredPageHeaderProps = {
  title: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  actionWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export function CenteredPageHeader({ title, leftAction, rightAction, actionWidth = 48, style }: CenteredPageHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[{ alignItems: 'center', flexDirection: 'row', minHeight: 48, marginBottom: Spacing.md }, style]}>
      <View style={{ alignItems: 'flex-start', justifyContent: 'center', width: actionWidth }}>{leftAction}</View>
      <Text
        accessibilityRole="header"
        adjustsFontSizeToFit
        minimumFontScale={0.78}
        numberOfLines={2}
        style={{ color: colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['2xl'], letterSpacing: -0.5, lineHeight: 29, textAlign: 'center' }}
      >
        {title}
      </Text>
      <View style={{ alignItems: 'flex-end', justifyContent: 'center', width: actionWidth }}>{rightAction}</View>
    </View>
  );
}
