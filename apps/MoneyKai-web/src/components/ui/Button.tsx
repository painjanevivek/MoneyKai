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
import { BorderRadius, ComponentTokens, Shadows, Typography } from '../../constants/theme';
import { withAlpha } from '@/utils/glassStyle';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  tone?: 'default' | 'onDark';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
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
  testID,
}) => {
  const { colors, isDark } = useTheme();

  const sizeStyles = {
    sm: { minHeight: ComponentTokens.controlHeight.sm, paddingHorizontal: ComponentTokens.controlPaddingX.sm, fontSize: Typography.fontSize.sm, iconSize: 16 },
    md: { minHeight: ComponentTokens.controlHeight.md, paddingHorizontal: ComponentTokens.controlPaddingX.md, fontSize: Typography.fontSize.base, iconSize: 18 },
    lg: { minHeight: ComponentTokens.controlHeight.lg, paddingHorizontal: ComponentTokens.controlPaddingX.lg, fontSize: Typography.fontSize.md, iconSize: 20 },
  };

  const variantStyles: Record<string, { bg: string; text: string; border?: string; hoverBg: string; hoverBorder?: string }> = tone === 'onDark'
    ? {
        primary: { bg: '#FFFFFF', text: colors.primaryDark, hoverBg: '#F7FFFD', hoverBorder: withAlpha(colors.primaryLight, 0.7) },
        secondary: { bg: withAlpha(colors.primary, 0.18), text: '#FFFFFF', hoverBg: withAlpha(colors.primary, 0.28), hoverBorder: withAlpha(colors.primaryLight, 0.34) },
        outline: { bg: 'rgba(255, 255, 255, 0.12)', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.24)', hoverBg: withAlpha(colors.accent, 0.24), hoverBorder: withAlpha(colors.accent, 0.48) },
        ghost: { bg: 'transparent', text: 'rgba(255, 255, 255, 0.82)', hoverBg: 'rgba(255, 255, 255, 0.12)', hoverBorder: 'rgba(255, 255, 255, 0.22)' },
        danger: { bg: 'rgba(255, 225, 229, 0.94)', text: '#7F1D1D', hoverBg: '#FFFFFF', hoverBorder: 'rgba(255, 255, 255, 0.6)' },
      }
    : {
    primary: { bg: colors.primary, text: colors.textInverse, hoverBg: colors.primaryDark, hoverBorder: withAlpha(colors.primaryLight, isDark ? 0.7 : 0.32) },
    secondary: { bg: colors.primaryBg, text: colors.primaryDark, hoverBg: withAlpha(colors.primary, isDark ? 0.2 : 0.12), hoverBorder: withAlpha(colors.primary, 0.28) },
    outline: { bg: colors.surface, text: colors.textPrimary, border: colors.borderLight, hoverBg: colors.surfaceElevated, hoverBorder: withAlpha(colors.primary, 0.34) },
    ghost: { bg: 'transparent', text: colors.textSecondary, hoverBg: withAlpha(colors.primary, 0.1), hoverBorder: withAlpha(colors.primary, 0.2) },
    danger: { bg: colors.emergency, text: colors.textInverse, hoverBg: `${colors.emergency}E6`, hoverBorder: colors.emergency },
  };

  const s = sizeStyles[size];
  const v = variantStyles[variant];
  const isUnavailable = disabled || loading;
  const contentColor = isUnavailable ? colors.textTertiary : v.text;

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      disabled={isUnavailable}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isUnavailable }}
      style={({ hovered, pressed, focused }: any) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isUnavailable ? colors.surfaceElevated : !isUnavailable && hovered ? v.hoverBg : v.bg,
          minHeight: s.minHeight,
          minWidth: 0,
          maxWidth: '100%',
          paddingHorizontal: s.paddingHorizontal,
          borderRadius: BorderRadius.full,
          opacity: isUnavailable ? ComponentTokens.disabledOpacity : 1,
          gap: 8,
          transform: pressed ? [{ scale: ComponentTokens.pressedScale }] : !isUnavailable && hovered ? [{ translateY: -1 }] : [{ translateY: 0 }],
          borderWidth: 1,
          borderColor: isUnavailable
            ? colors.borderLight
            : focused
              ? colors.primary
              : hovered
                ? (v.hoverBorder ?? 'transparent')
                : (v.border ?? 'transparent'),
          ...(variant === 'primary' && !isUnavailable
            ? { ...Shadows.sm, shadowColor: isDark ? colors.primary : colors.shadowColor }
            : {}),
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
                flexShrink: 1,
                minWidth: 0,
              },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <MaterialCommunityIcons name={icon} size={s.iconSize} color={contentColor} />
          )}
        </>
      )}
    </Pressable>
  );
};

export default Button;
