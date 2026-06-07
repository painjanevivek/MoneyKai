import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  color?: string;
  padding?: keyof typeof Spacing;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  color,
  padding = 'base',
}) => {
  const { colors, isDark } = useTheme();

  const bgColor = color
    ? `${color}15`
    : isDark
      ? 'rgba(30, 41, 59, 0.7)'
      : 'rgba(255, 255, 255, 0.85)';

  const borderColor = color
    ? `${color}30`
    : isDark
      ? 'rgba(51, 65, 85, 0.5)'
      : 'rgba(255, 255, 255, 0.3)';

  return (
    <View
      style={[
        {
          backgroundColor: bgColor,
          borderRadius: BorderRadius.lg,
          padding: Spacing[padding],
          borderWidth: 1,
          borderColor: borderColor,
          ...Shadows.md,
          shadowColor: colors.shadowColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default GlassCard;
