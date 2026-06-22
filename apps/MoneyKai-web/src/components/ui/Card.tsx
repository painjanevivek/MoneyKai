import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { softGlassBackdropStyle, withAlpha } from '@/utils/glassStyle';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  tone?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  padding?: keyof typeof Spacing;
  borderRadius?: keyof typeof BorderRadius;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  tone = 'default',
  padding = 'base',
  borderRadius = 'lg',
}) => {
  const { colors, isDark } = useTheme();
  const isGlass = variant === 'default' || variant === 'glass';
  const toneColor = {
    default: colors.primary,
    primary: colors.primary,
    accent: colors.accent,
    success: colors.success,
    warning: colors.warning,
    danger: colors.error,
    info: colors.info,
  }[tone];
  const surfaceColor = isGlass
    ? colors.glassBg
    : variant === 'elevated'
      ? colors.surfaceElevated
      : colors.card;

  const cardStyle: ViewStyle = {
    backgroundColor: surfaceColor,
    borderRadius: BorderRadius[borderRadius],
    padding: Spacing[padding],
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    ...(variant === 'outlined'
      ? { borderWidth: 1, borderColor: colors.borderLight }
      : variant === 'elevated'
        ? { borderWidth: 1, borderColor: colors.borderLight, ...Shadows.lg, shadowColor: colors.shadowColor }
        : {
            borderWidth: 1,
            borderColor: tone === 'default'
              ? (isGlass ? colors.glassBorder : colors.borderLight)
              : withAlpha(toneColor, isDark ? 0.34 : 0.24),
            ...Shadows.md,
            shadowColor: colors.shadowColor,
            ...(softGlassBackdropStyle ?? {}),
          }
    ),
  };

  return (
    <View style={[cardStyle, style]}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: tone === 'default' ? 0 : 3,
          backgroundColor: withAlpha(toneColor, 0.82),
        }}
      />
      {tone === 'default' ? null : (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -72,
            right: -58,
            width: 132,
            height: 132,
            borderRadius: 999,
            backgroundColor: withAlpha(toneColor, isDark ? 0.1 : 0.06),
          }}
        />
      )}
      {children}
    </View>
  );
};

export default Card;
