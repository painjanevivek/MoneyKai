import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, getExperienceThemeTokens, Shadows, Spacing } from '../../constants/theme';
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
  borderRadius = 'md',
}) => {
  const { colors, isDark, theme } = useTheme();
  const experience = getExperienceThemeTokens(theme);
  const isToned = tone !== 'default';
  const toneColor = {
    default: experience.emphasis.primaryAction,
    primary: experience.emphasis.primaryAction,
    accent: colors.accent,
    success: experience.status.success,
    warning: experience.status.warning,
    danger: experience.status.error,
    info: experience.status.info,
  }[tone];
  const surfaceColor = variant === 'default'
    ? experience.surface.base
    : variant === 'glass'
      ? colors.surface
    : variant === 'elevated'
      ? experience.surface.raised
      : experience.surface.base;

  const cardStyle: ViewStyle = {
    backgroundColor: surfaceColor,
    borderRadius: BorderRadius[borderRadius],
    padding: Spacing[padding],
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    ...(variant === 'default'
      ? {
          borderWidth: 1,
          borderColor: isToned ? withAlpha(toneColor, isDark ? 0.28 : 0.2) : experience.divider,
        }
      : variant === 'outlined'
      ? { borderWidth: 1, borderColor: experience.divider, backgroundColor: 'transparent' }
      : variant === 'elevated'
        ? { borderWidth: 1, borderColor: experience.divider, ...Shadows.sm, shadowColor: colors.shadowColor }
        : {
            borderWidth: 1,
            borderColor: isToned ? withAlpha(toneColor, isDark ? 0.34 : 0.24) : experience.divider,
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
