import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Typography, Spacing } from '../../constants/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox-outline',
  title,
  message,
  action,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.card,
          borderColor: colors.borderLight,
          borderRadius: BorderRadius.sm,
          borderWidth: 1,
          paddingVertical: Spacing['2xl'],
          paddingHorizontal: Spacing.xl,
          ...Shadows.sm,
          shadowColor: colors.shadowColor,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: BorderRadius.full,
          backgroundColor: colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.md,
          borderWidth: 1,
          borderColor: `${colors.primary}22`,
        }}
      >
        <MaterialCommunityIcons name={icon} size={28} color={colors.primary} />
      </View>
      <Text
        style={{
          fontSize: Typography.fontSize.md,
          fontFamily: Typography.fontFamily.semiBold,
          color: colors.textPrimary,
          marginBottom: Spacing.xs,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {message && (
        <Text
          style={{
            fontSize: Typography.fontSize.base,
            fontFamily: Typography.fontFamily.regular,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: Typography.lineHeight.base,
          }}
        >
          {message}
        </Text>
      )}
      {action && <View style={{ marginTop: Spacing.lg }}>{action}</View>}
    </View>
  );
};

export default EmptyState;
