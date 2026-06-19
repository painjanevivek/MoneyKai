import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: keyof typeof Spacing;
  borderRadius?: keyof typeof BorderRadius;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'base',
  borderRadius = 'sm',
}) => {
  const { colors } = useTheme();
  const isGlass = variant === 'default' || variant === 'glass';

  const cardStyle: ViewStyle = {
    backgroundColor: isGlass ? colors.glassBg : variant === 'elevated' ? colors.surfaceElevated : colors.card,
    borderRadius: BorderRadius[borderRadius],
    padding: Spacing[padding],
    overflow: 'hidden',
    ...(variant === 'outlined'
      ? { borderWidth: 1, borderColor: colors.borderLight }
      : variant === 'elevated'
        ? { borderWidth: 1, borderColor: colors.borderLight, ...Shadows.lg, shadowColor: colors.shadowColor }
        : {
            borderWidth: 1,
            borderColor: isGlass ? colors.glassBorder : colors.borderLight,
            ...Shadows.md,
            shadowColor: colors.shadowColor,
          }
    ),
  };

  return <View style={[cardStyle, style]}>{children}</View>;
};

export default Card;
