import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { withAlpha } from '@/utils/glassStyle';

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
  const isToned = tone !== 'default';
  const toneColor = {
    default: colors.primary,
    primary: colors.primary,
    accent: colors.accent,
    success: colors.success,
    warning: colors.warning,
    danger: colors.error,
    info: colors.info,
  }[tone];
  const surfaceColor = variant === 'default'
    ? 'transparent'
    : variant === 'glass'
      ? colors.surface
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
    ...(variant === 'default'
      ? {
          borderWidth: isToned ? 1 : 0,
          borderColor: isToned ? withAlpha(toneColor, isDark ? 0.28 : 0.2) : 'transparent',
        }
      : variant === 'outlined'
      ? { borderWidth: 1, borderColor: colors.borderLight, backgroundColor: 'transparent' }
      : variant === 'elevated'
        ? { borderWidth: 1, borderColor: colors.borderLight, ...Shadows.sm, shadowColor: colors.shadowColor }
        : {
            borderWidth: 1,
            borderColor: isToned ? withAlpha(toneColor, isDark ? 0.34 : 0.24) : colors.borderLight,
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
          height: isToned ? 2 : 0,
          backgroundColor: withAlpha(toneColor, 0.82),
        }}
      />
      {children}
    </View>
  );
};

export default Card;
