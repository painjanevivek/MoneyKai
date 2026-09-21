import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'raised' | 'outlined' | 'support' | 'glass';
  padding?: keyof typeof Spacing;
  borderRadius?: keyof typeof BorderRadius;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'base',
  borderRadius = 'md',
  testID,
}) => {
  const { colors } = useTheme();
  const isGlass = variant === 'glass';
  const isRaised = variant === 'elevated' || variant === 'raised';

  const cardStyle: ViewStyle = {
    backgroundColor: isGlass
      ? colors.glassBg
      : variant === 'support'
        ? colors.surfaceSupport
        : isRaised
          ? colors.surface
          : colors.card,
    borderRadius: BorderRadius[borderRadius],
    padding: Spacing[padding],
    ...(variant === 'outlined'
      ? { borderWidth: 1, borderColor: colors.border }
      : isRaised
        ? { borderWidth: 1, borderColor: colors.borderLight, ...Shadows.md, shadowColor: colors.shadowColor }
        : {
            borderWidth: 1,
            borderColor: isGlass ? colors.glassBorder : colors.borderLight,
            ...(isGlass ? { ...Shadows.sm, shadowColor: colors.shadowColor } : {}),
          }
    ),
  };

  return <View style={[cardStyle, style]} testID={testID}>{children}</View>;
};

export default Card;
