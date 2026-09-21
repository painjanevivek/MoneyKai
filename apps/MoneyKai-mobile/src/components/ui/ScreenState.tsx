import React from 'react';
import { ActivityIndicator, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useAppMotion } from '@/hooks/useAppMotion';
import { AppIcon } from './AppIcon';
import { Button } from './Button';
import { getFeedbackPalette, SCREEN_STATE_DEFAULTS, type ScreenStateKind } from './uiContracts';

type ScreenStateProps = {
  actionLabel?: string;
  body: string;
  icon?: string;
  loading?: boolean;
  kind?: ScreenStateKind;
  onAction?: () => void;
  style?: ViewStyle;
  tone?: 'neutral' | 'primary' | 'danger';
  title: string;
};

export function ScreenState({
  actionLabel,
  body,
  icon,
  loading = false,
  kind,
  onAction,
  style,
  tone = 'neutral',
  title,
}: ScreenStateProps) {
  const { colors } = useTheme();
  const { reduceMotion } = useAppMotion();
  const resolvedKind: ScreenStateKind = loading ? 'loading' : kind ?? (tone === 'danger' ? 'error' : 'neutral');
  const stateDefaults = SCREEN_STATE_DEFAULTS[resolvedKind];
  const palette = getFeedbackPalette(colors, tone === 'primary' ? 'info' : stateDefaults.tone);
  const resolvedIcon = icon ?? stateDefaults.icon;

  return (
    <Animated.View
      accessibilityLiveRegion={resolvedKind === 'error' || resolvedKind === 'conflict' ? 'assertive' : 'polite'}
      accessibilityRole={resolvedKind === 'error' || resolvedKind === 'conflict' ? 'alert' : undefined}
      entering={reduceMotion ? undefined : FadeIn.duration(180)}
      layout={reduceMotion ? undefined : Layout.springify().damping(18).stiffness(180)}
      style={[
        {
          alignItems: 'center',
          backgroundColor: colors.card,
          borderColor: colors.borderLight,
          borderRadius: BorderRadius.sm,
          borderWidth: 1,
          gap: Spacing.sm,
          padding: Spacing.xl,
        },
        style,
      ]}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: palette.background,
          borderRadius: BorderRadius.full,
          borderWidth: 1,
          borderColor: palette.border,
          height: 48,
          justifyContent: 'center',
          width: 48,
        }}
      >
        {loading ? (
          <ActivityIndicator color={palette.foreground} />
        ) : (
          <AppIcon name={resolvedIcon} size={24} color={palette.foreground} />
        )}
      </View>
      <Text
        selectable
        style={{
          color: colors.textPrimary,
          fontFamily: Typography.fontFamily.bold,
          fontSize: Typography.fontSize.md,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        selectable
        style={{
          color: colors.textSecondary,
          fontFamily: Typography.fontFamily.regular,
          fontSize: Typography.fontSize.sm,
          lineHeight: Typography.lineHeight.sm,
          textAlign: 'center',
        }}
      >
        {body}
      </Text>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} size="sm" variant={tone === 'danger' ? 'danger' : 'secondary'} />
      )}
    </Animated.View>
  );
}

export default ScreenState;
