import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { CommonActions, NavigationProp, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { RootStackParamList } from '@/navigation/types';
import { PressableScale } from './PressableScale';

export function ScreenBackButton({ style }: { style?: StyleProp<ViewStyle> }) {
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
      onPress={goBack}
      style={[
        {
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: colors.card,
          borderColor: colors.borderLight,
          borderRadius: BorderRadius.full,
          borderWidth: 1,
          height: 48,
          justifyContent: 'center',
          marginBottom: Spacing.md,
          width: 48,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
    </PressableScale>
  );
}
