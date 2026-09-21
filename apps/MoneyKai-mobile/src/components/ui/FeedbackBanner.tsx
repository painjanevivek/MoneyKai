import React from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { AppIcon } from './AppIcon';
import { BorderRadius, ComponentTokens, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getFeedbackPalette, type FeedbackTone } from './uiContracts';

type FeedbackBannerProps = {
  title: string;
  message?: string;
  tone?: FeedbackTone;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

export function FeedbackBanner({
  title,
  message,
  tone = 'neutral',
  icon,
  actionLabel,
  onAction,
  style,
}: FeedbackBannerProps) {
  const { colors } = useTheme();
  const palette = getFeedbackPalette(colors, tone);
  const resolvedIcon = icon ?? (tone === 'success' ? 'check-circle-outline' : tone === 'danger' ? 'alert-circle-outline' : tone === 'offline' ? 'cloud-off-outline' : 'information-outline');

  return (
    <View
      accessibilityLiveRegion={tone === 'danger' ? 'assertive' : 'polite'}
      accessibilityRole="alert"
      style={[
        {
          alignItems: 'flex-start',
          backgroundColor: palette.background,
          borderColor: palette.border,
          borderLeftWidth: 3,
          borderRadius: BorderRadius.md,
          flexDirection: 'row',
          gap: Spacing.md,
          padding: Spacing.md,
        },
        style,
      ]}
    >
      <AppIcon name={resolvedIcon} color={palette.foreground} size={20} />
      <View style={{ flex: 1, gap: Spacing.xs }}>
        <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>
          {title}
        </Text>
        {message ? (
          <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, lineHeight: Typography.lineHeight.sm }}>
            {message}
          </Text>
        ) : null}
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            style={({ pressed }) => ({
              alignItems: 'center',
              alignSelf: 'flex-start',
              justifyContent: 'center',
              minHeight: ComponentTokens.minTouchTarget,
              opacity: pressed ? ComponentTokens.pressedOpacity : 1,
            })}
          >
            <Text style={{ color: palette.foreground, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default FeedbackBanner;
