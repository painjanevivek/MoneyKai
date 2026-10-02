import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { MoneyKaiBrandMark } from '@/components/branding/MoneyKaiBrandMark';
import { AppIcon } from '@/components/ui/AppIcon';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function AuthHeader({ onBack }: { onBack?: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: 'center', height: 56, justifyContent: 'center', width: '100%' }}>
      {onBack ? (
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={{ alignItems: 'center', height: 48, justifyContent: 'center', left: 0, position: 'absolute', width: 48 }}
        >
          <AppIcon color={colors.textPrimary} name="arrow-left" size={24} />
        </Pressable>
      ) : null}
      <View accessible accessibilityLabel="MoneyKai" accessibilityRole="header" style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }}>
        <MoneyKaiBrandMark size={28} />
        <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], letterSpacing: -0.4 }}>
          MoneyKai
        </Text>
      </View>
    </View>
  );
}
