import React, { useId, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, ComponentTokens, IconSize, Spacing, Typography } from '../../constants/theme';
import { AppIcon } from './AppIcon';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  icon?: string;
  required?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'number-pad' | 'decimal-pad' | 'email-address' | 'phone-pad';
  inputMode?: TextInputProps['inputMode'];
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  prefix?: string;
  suffix?: string;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  autoCorrect?: boolean;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  icon,
  required = false,
  secureTextEntry = false,
  keyboardType = 'default',
  inputMode,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
  inputStyle,
  prefix,
  suffix,
  maxLength,
  autoCapitalize = 'sentences',
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  autoCorrect,
  testID,
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(!secureTextEntry);
  const reactId = useId();
  const inputLabel = label ? `${label}${required ? ', required' : ''}` : placeholder;
  const resolvedAutoCorrect = autoCorrect ?? (!secureTextEntry && keyboardType !== 'email-address');

  const borderColor = error
    ? colors.error
    : isFocused
      ? colors.primary
      : colors.border;
  const supportingColor = error ? colors.error : isFocused ? colors.primary : colors.textSecondary;

  return (
    <View style={[{ marginBottom: Spacing.base }, style]}>
      {label && (
        <Text
          nativeID={`${reactId}-label`}
          style={{
            fontSize: Typography.fontSize.sm,
            fontFamily: Typography.fontFamily.semiBold,
            color: supportingColor,
            marginBottom: Spacing.sm,
          }}
        >
          {label}{required ? ' *' : ''}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: editable ? colors.surface : colors.surfaceElevated,
          borderRadius: BorderRadius.md,
          borderWidth: isFocused ? 2 : ComponentTokens.borderWidth,
          borderColor,
          paddingHorizontal: Spacing.md,
          paddingVertical: multiline ? Spacing.md : 0,
          minHeight: multiline ? 104 : ComponentTokens.controlHeight.md,
          opacity: editable ? 1 : ComponentTokens.disabledOpacity,
        }}
      >
        {icon && (
          <AppIcon
            name={icon}
            size={IconSize.sm}
            color={isFocused ? colors.primary : colors.textTertiary}
            style={{ marginRight: Spacing.sm }}
          />
        )}
        {prefix && (
          <Text
            style={{
              fontSize: Typography.fontSize.md,
              fontFamily: Typography.fontFamily.semiBold,
              color: colors.textPrimary,
              marginRight: 4,
            }}
          >
            {prefix}
          </Text>
        )}
        <TextInput
          accessibilityLabel={inputLabel}
          accessibilityHint={error ?? helperText}
          accessibilityState={{ disabled: !editable }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!isSecureVisible}
          keyboardType={keyboardType}
          inputMode={inputMode}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCorrect={resolvedAutoCorrect}
          testID={testID}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            {
              flex: 1,
              fontSize: Typography.fontSize.base,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textPrimary,
              paddingVertical: multiline ? 0 : 12,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            inputStyle,
          ]}
        />
        {suffix && (
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textTertiary,
              marginLeft: 4,
            }}
          >
            {suffix}
          </Text>
        )}
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecureVisible(!isSecureVisible)}
            accessibilityRole="button"
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
            accessibilityState={{ disabled: !editable }}
            disabled={!editable}
            style={{ alignItems: 'center', height: ComponentTokens.minTouchTarget, justifyContent: 'center', marginRight: -Spacing.sm, width: ComponentTokens.minTouchTarget }}
          >
            <AppIcon
              name={isSecureVisible ? 'eye-off-outline' : 'eye-outline'}
              size={IconSize.sm}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            fontSize: Typography.fontSize.xs,
            fontFamily: Typography.fontFamily.medium,
            color: colors.error,
            marginTop: Spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
      {!error && helperText ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: Typography.fontFamily.regular,
            fontSize: Typography.fontSize.xs,
            lineHeight: Typography.lineHeight.sm,
            marginTop: Spacing.xs,
          }}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

export default Input;
