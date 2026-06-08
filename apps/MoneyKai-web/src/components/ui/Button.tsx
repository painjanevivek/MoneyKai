import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Typography } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: Typography.fontSize.sm, iconSize: 16 },
    md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: Typography.fontSize.base, iconSize: 18 },
    lg: { paddingVertical: 16, paddingHorizontal: 28, fontSize: Typography.fontSize.md, iconSize: 20 },
  };

  const variantStyles: Record<string, { bg: string; text: string; border?: string; hoverBg: string; hoverBorder?: string }> = {
    primary: { bg: colors.primary, text: colors.textInverse, hoverBg: colors.primaryLight, hoverBorder: colors.primaryLight },
    secondary: { bg: colors.primaryBg, text: colors.primary, hoverBg: `${colors.primary}18`, hoverBorder: `${colors.primary}28` },
    outline: { bg: 'transparent', text: colors.primary, border: colors.primary, hoverBg: `${colors.primary}12`, hoverBorder: colors.primaryLight },
    ghost: { bg: 'transparent', text: colors.textSecondary, hoverBg: `${colors.primary}10`, hoverBorder: `${colors.primary}20` },
    danger: { bg: colors.emergency, text: colors.textInverse, hoverBg: `${colors.emergency}E6`, hoverBorder: colors.emergency },
  };

  const s = sizeStyles[size];
  const v = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ hovered, pressed }: any) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: !disabled && hovered ? v.hoverBg : v.bg,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          borderRadius: BorderRadius.md,
          opacity: disabled ? 0.5 : 1,
          gap: 8,
          transform: !disabled && hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
          borderWidth: 1.5,
          borderColor: !disabled && hovered ? (v.hoverBorder ?? 'transparent') : (v.border ?? 'transparent'),
          ...(fullWidth ? { width: '100%' } : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <MaterialCommunityIcons name={icon} size={s.iconSize} color={v.text} />
          )}
          <Text
            style={[
              {
                fontSize: s.fontSize,
                fontFamily: Typography.fontFamily.semiBold,
                color: v.text,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <MaterialCommunityIcons name={icon} size={s.iconSize} color={v.text} />
          )}
        </>
      )}
    </Pressable>
  );
};

export default Button;
