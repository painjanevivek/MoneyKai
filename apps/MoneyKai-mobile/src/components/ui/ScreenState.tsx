import React from 'react';
import { ActivityIndicator, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { Button } from './Button';

type ScreenStateProps = {
  actionLabel?: string;
  body: string;
  icon?: string;
  loading?: boolean;
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
  onAction,
  style,
  tone = 'neutral',
  title,
}: ScreenStateProps) {
  const { colors } = useTheme();
  const toneColor = tone === 'danger' ? colors.error : tone === 'primary' ? colors.primary : colors.textSecondary;
  const resolvedIcon = icon ?? (loading ? 'sync' : tone === 'danger' ? 'alert-circle-outline' : 'tray');

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      layout={Layout.springify().damping(18).stiffness(180)}
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
          backgroundColor: tone === 'danger' ? colors.emergencyBg : colors.primaryBg,
          borderRadius: BorderRadius.full,
          borderWidth: 1,
          borderColor: tone === 'danger' ? `${colors.error}22` : `${colors.primary}22`,
          height: 48,
          justifyContent: 'center',
          width: 48,
        }}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name={resolvedIcon} size={24} color={toneColor} />
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
