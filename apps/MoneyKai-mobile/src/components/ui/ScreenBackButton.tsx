import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { CommonActions, NavigationProp, useNavigation } from '@react-navigation/native';
import { AppIcon } from './AppIcon';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { RootStackParamList } from '@/navigation/types';
import { PressableScale } from './PressableScale';

export function ScreenBackButton({ compact = false, style }: { compact?: boolean; style?: StyleProp<ViewStyle> }) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.dispatch(CommonActions.navigate({ name: 'App' }));
  };

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={compact ? 6 : undefined}
      onPress={goBack}
      style={[
        {
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: colors.card,
          borderColor: colors.borderLight,
          borderRadius: BorderRadius.full,
          borderWidth: 1,
          height: compact ? 36 : 48,
          justifyContent: 'center',
          marginBottom: compact ? 0 : Spacing.md,
          width: compact ? 36 : 48,
        },
        style,
      ]}
    >
      <AppIcon name="arrow-left" size={compact ? 19 : 24} color={colors.textPrimary} />
    </PressableScale>
  );
}
