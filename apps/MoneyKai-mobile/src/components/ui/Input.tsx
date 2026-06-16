import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, ComponentTokens, Spacing, Typography } from '../../constants/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon?: string;
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
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  icon,
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
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(!secureTextEntry);
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
          style={{
            fontSize: Typography.fontSize.sm,
            fontFamily: Typography.fontFamily.semiBold,
            color: supportingColor,
            marginBottom: Spacing.sm,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: editable ? colors.surface : colors.surfaceElevated,
          borderRadius: BorderRadius.md,
          borderWidth: 1.5,
          borderColor,
          paddingHorizontal: Spacing.md,
          paddingVertical: multiline ? Spacing.md : 0,
          minHeight: multiline ? 104 : ComponentTokens.controlHeight.md,
          opacity: editable ? 1 : ComponentTokens.disabledOpacity,
        }}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
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
          accessibilityLabel={label ?? placeholder}
          accessibilityHint={error ? error : undefined}
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
          >
            <MaterialCommunityIcons
              name={isSecureVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text
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
    </View>
  );
};

export default Input;
