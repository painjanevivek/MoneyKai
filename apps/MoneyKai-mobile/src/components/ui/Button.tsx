import React from 'react';
import {
  Text,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, ComponentTokens, Shadows, Typography } from '../../constants/theme';
import { PressableScale } from './PressableScale';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  tone?: 'default' | 'onDark';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  tone = 'default',
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
    sm: { minHeight: ComponentTokens.controlHeight.sm, paddingHorizontal: ComponentTokens.controlPaddingX.sm, fontSize: Typography.fontSize.sm, iconSize: 16 },
    md: { minHeight: ComponentTokens.controlHeight.md, paddingHorizontal: ComponentTokens.controlPaddingX.md, fontSize: Typography.fontSize.base, iconSize: 18 },
    lg: { minHeight: ComponentTokens.controlHeight.lg, paddingHorizontal: ComponentTokens.controlPaddingX.lg, fontSize: Typography.fontSize.md, iconSize: 20 },
  };

  const variantStyles: Record<string, { bg: string; text: string; border?: string }> = tone === 'onDark'
    ? {
        primary: { bg: 'rgba(255, 255, 255, 0.94)', text: colors.primaryDark, border: 'rgba(255, 255, 255, 0.38)' },
        secondary: { bg: 'rgba(255, 255, 255, 0.16)', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.28)' },
        outline: { bg: 'rgba(255, 255, 255, 0.14)', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.28)' },
        ghost: { bg: 'transparent', text: 'rgba(255, 255, 255, 0.84)', border: 'transparent' },
        danger: { bg: 'rgba(255, 225, 229, 0.94)', text: '#7F1D1D', border: 'rgba(255, 255, 255, 0.38)' },
      }
    : {
        primary: { bg: colors.primary, text: colors.textInverse },
        secondary: { bg: colors.primaryBg, text: colors.primary },
        outline: { bg: colors.card, text: colors.primary, border: colors.borderLight },
        ghost: { bg: 'transparent', text: colors.textSecondary },
        danger: { bg: colors.emergency, text: colors.textInverse },
      };

  const s = sizeStyles[size];
  const v = variantStyles[variant];
  const isUnavailable = disabled || loading;
  const contentColor = isUnavailable ? colors.textTertiary : v.text;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isUnavailable }}
      onPress={onPress}
      disabled={isUnavailable}
      pressedScale={ComponentTokens.pressedScale}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isUnavailable ? colors.surfaceElevated : v.bg,
          minHeight: s.minHeight,
          paddingHorizontal: s.paddingHorizontal,
          borderRadius: BorderRadius.sm,
          opacity: isUnavailable ? ComponentTokens.disabledOpacity : 1,
          gap: 8,
          borderWidth: 1,
          borderColor: isUnavailable ? colors.borderLight : (v.border ?? 'transparent'),
          ...(variant === 'primary' && !isUnavailable ? { ...Shadows.sm, shadowColor: colors.shadowColor } : {}),
          ...(fullWidth ? { width: '100%' } : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <MaterialCommunityIcons name={icon} size={s.iconSize} color={contentColor} />
          )}
          <Text
            style={[
              {
                fontSize: s.fontSize,
                fontFamily: Typography.fontFamily.semiBold,
                color: contentColor,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <MaterialCommunityIcons name={icon} size={s.iconSize} color={contentColor} />
          )}
        </>
      )}
    </PressableScale>
  );
};

export default Button;
