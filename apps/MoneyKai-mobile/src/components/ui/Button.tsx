import React from 'react';
import {
  Text,
  ActivityIndicator,
  type AccessibilityProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, ComponentTokens, IconSize, Typography } from '../../constants/theme';
import { PressableScale } from './PressableScale';
import { AppIcon } from './AppIcon';

interface ButtonProps extends Pick<AccessibilityProps, 'accessibilityHint' | 'accessibilityLabel'> {
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
  testID?: string;
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
  accessibilityHint,
  accessibilityLabel,
  testID,
}) => {
  const { colors } = useTheme();

  const sizeStyles = {
    sm: { minHeight: ComponentTokens.controlHeight.sm, paddingHorizontal: ComponentTokens.controlPaddingX.sm, fontSize: Typography.fontSize.sm, iconSize: IconSize.xs },
    md: { minHeight: ComponentTokens.controlHeight.md, paddingHorizontal: ComponentTokens.controlPaddingX.md, fontSize: Typography.fontSize.base, iconSize: IconSize.sm },
    lg: { minHeight: ComponentTokens.controlHeight.lg, paddingHorizontal: ComponentTokens.controlPaddingX.lg, fontSize: Typography.fontSize.md, iconSize: IconSize.md },
  };

  const variantStyles: Record<string, { bg: string; text: string; border?: string }> = tone === 'onDark'
    ? {
        primary: { bg: colors.surface, text: colors.primaryDark, border: colors.borderLight },
        secondary: { bg: colors.surfaceSupport, text: colors.textPrimary, border: colors.border },
        outline: { bg: 'transparent', text: colors.textInverse, border: colors.textInverse },
        ghost: { bg: 'transparent', text: colors.textInverse, border: 'transparent' },
        danger: { bg: colors.errorBg, text: colors.error, border: colors.error },
      }
    : {
        primary: { bg: colors.action, text: colors.onAction, border: colors.action },
        secondary: { bg: colors.primaryBg, text: colors.primaryDark, border: colors.primaryBg },
        outline: { bg: colors.card, text: colors.primaryDark, border: colors.border },
        ghost: { bg: 'transparent', text: colors.textSecondary },
        danger: { bg: colors.error, text: colors.textInverse, border: colors.error },
      };

  const s = sizeStyles[size];
  const v = variantStyles[variant];
  const isUnavailable = disabled || loading;
  const contentColor = isUnavailable ? colors.textTertiary : v.text;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
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
          borderWidth: ComponentTokens.borderWidth,
          borderColor: isUnavailable ? colors.borderLight : (v.border ?? 'transparent'),
          ...(fullWidth ? { width: '100%' } : {}),
        },
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <AppIcon name={icon} size={s.iconSize} color={contentColor} />
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
            <AppIcon name={icon} size={s.iconSize} color={contentColor} />
          )}
        </>
      )}
    </PressableScale>
  );
};

export default Button;
