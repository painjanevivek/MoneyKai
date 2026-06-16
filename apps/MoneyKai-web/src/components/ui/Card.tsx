import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
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

  const cardStyle: ViewStyle = {
    backgroundColor: variant === 'elevated' ? colors.surfaceElevated : colors.card,
    borderRadius: BorderRadius[borderRadius],
    padding: Spacing[padding],
    ...(variant === 'outlined'
      ? { borderWidth: 1, borderColor: colors.borderLight }
      : variant === 'elevated'
        ? { borderWidth: 1, borderColor: colors.borderLight, ...Shadows.lg, shadowColor: colors.shadowColor }
        : { borderWidth: 1, borderColor: colors.borderLight, ...Shadows.sm, shadowColor: colors.shadowColor }
    ),
  };

  return <View style={[cardStyle, style]}>{children}</View>;
};

export default Card;
