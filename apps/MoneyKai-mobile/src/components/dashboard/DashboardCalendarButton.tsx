import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';

interface DashboardCalendarButtonProps {
  monthLabel: string;
  onPress: () => void;
}

export const DashboardCalendarButton = ({ monthLabel, onPress }: DashboardCalendarButtonProps) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Select calendar month, currently ${monthLabel}`}
      activeOpacity={0.82}
      onPress={onPress}
      style={{
        minWidth: 42,
        height: 42,
        borderRadius: BorderRadius.md,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: Spacing.sm,
        ...Shadows.sm,
        shadowColor: colors.shadowColor,
      }}
    >
      <MaterialCommunityIcons name="calendar-month-outline" size={21} color={colors.textPrimary} />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={{
          position: 'absolute',
          bottom: 4,
          fontSize: 8,
          fontFamily: Typography.fontFamily.bold,
          color: colors.textPrimary,
          maxWidth: 34,
        }}
      >
        {monthLabel.slice(0, 3)}
      </Text>
    </TouchableOpacity>
  );
};
