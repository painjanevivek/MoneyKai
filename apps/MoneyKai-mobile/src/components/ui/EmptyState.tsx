import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Typography, Spacing } from '../../constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
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
          paddingVertical: Spacing['3xl'],
          paddingHorizontal: Spacing.xl,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.base,
        }}
      >
        <MaterialCommunityIcons name={icon} size={36} color={colors.primary} />
      </View>
      <Text
        style={{
          fontSize: Typography.fontSize.lg,
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
            lineHeight: 22,
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
