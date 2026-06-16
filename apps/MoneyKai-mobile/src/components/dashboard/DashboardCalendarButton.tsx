import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';

interface DashboardCalendarButtonProps {
  monthLabel: string;
  onPress: () => void;
  inverted?: boolean;
}

export const DashboardCalendarButton = ({ monthLabel, onPress, inverted = false }: DashboardCalendarButtonProps) => {
  const { colors } = useTheme();
  const foreground = inverted ? '#FFFFFF' : colors.textPrimary;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Select calendar month, currently ${monthLabel}`}
      activeOpacity={0.82}
      onPress={onPress}
      style={{
        minWidth: 42,
        height: 42,
        borderRadius: BorderRadius.sm,
        backgroundColor: inverted ? 'rgba(255, 255, 255, 0.13)' : colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: inverted ? 'rgba(255, 255, 255, 0.18)' : colors.borderLight,
        paddingHorizontal: Spacing.sm,
        ...Shadows.sm,
        shadowColor: colors.shadowColor,
      }}
    >
      <MaterialCommunityIcons name="calendar-month-outline" size={21} color={foreground} />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={{
          position: 'absolute',
          bottom: 4,
          fontSize: 8,
          fontFamily: Typography.fontFamily.bold,
          color: foreground,
          maxWidth: 34,
        }}
      >
        {monthLabel.slice(0, 3)}
      </Text>
    </TouchableOpacity>
  );
};
