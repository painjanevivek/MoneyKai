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
import { BorderRadius, ComponentTokens, Typography } from '../../constants/theme';

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
  testID?: string;
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
  testID,
}) => {
  const { colors } = useTheme();

  const sizeStyles = {
    sm: { minHeight: ComponentTokens.controlHeight.sm, paddingHorizontal: ComponentTokens.controlPaddingX.sm, fontSize: Typography.fontSize.sm, iconSize: 16 },
    md: { minHeight: ComponentTokens.controlHeight.md, paddingHorizontal: ComponentTokens.controlPaddingX.md, fontSize: Typography.fontSize.base, iconSize: 18 },
    lg: { minHeight: ComponentTokens.controlHeight.lg, paddingHorizontal: ComponentTokens.controlPaddingX.lg, fontSize: Typography.fontSize.md, iconSize: 20 },
  };

  const variantStyles: Record<string, { bg: string; text: string; border?: string; hoverBg: string; hoverBorder?: string }> = {
    primary: { bg: colors.primary, text: colors.textInverse, hoverBg: colors.primaryDark, hoverBorder: colors.primaryDark },
    secondary: { bg: colors.primaryBg, text: colors.primary, hoverBg: `${colors.primary}18`, hoverBorder: `${colors.primary}28` },
    outline: { bg: colors.card, text: colors.primary, border: colors.borderLight, hoverBg: `${colors.primary}12`, hoverBorder: colors.primary },
    ghost: { bg: 'transparent', text: colors.textSecondary, hoverBg: `${colors.primary}10`, hoverBorder: `${colors.primary}20` },
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
          paddingHorizontal: s.paddingHorizontal,
          borderRadius: BorderRadius.sm,
          opacity: isUnavailable ? ComponentTokens.disabledOpacity : 1,
          gap: 8,
          transform: pressed ? [{ scale: ComponentTokens.pressedScale }] : !isUnavailable && hovered ? [{ translateY: -1 }] : [{ translateY: 0 }],
          borderWidth: 1.5,
          borderColor: isUnavailable
            ? colors.borderLight
            : focused
              ? colors.primary
              : hovered
                ? (v.hoverBorder ?? 'transparent')
                : (v.border ?? 'transparent'),
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
    </Pressable>
  );
};

export default Button;
