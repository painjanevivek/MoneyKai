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
  const { colors } = useTheme();

  const bgColor = color ? `${color}12` : colors.glassBg;
  const borderColor = color ? `${color}33` : colors.glassBorder;

  return (
    <View
      style={[
        {
          backgroundColor: bgColor,
          borderRadius: BorderRadius.lg,
          padding: Spacing[padding],
          borderWidth: 1,
          borderColor: borderColor,
          ...Shadows.sm,
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
