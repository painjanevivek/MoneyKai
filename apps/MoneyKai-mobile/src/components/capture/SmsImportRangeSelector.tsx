import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SMS_IMPORT_RANGE_OPTIONS } from '@/constants/smsImportRanges';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import type { SmsImportRangeId } from '@/types/smsImport';

interface SmsImportRangeSelectorProps {
  value: SmsImportRangeId;
  onChange: (rangeId: SmsImportRangeId) => void;
  disabled?: boolean;
}

export const SmsImportRangeSelector = ({ value, onChange, disabled }: SmsImportRangeSelectorProps) => {
  const { colors } = useTheme();

  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
        SMS import range
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        {SMS_IMPORT_RANGE_OPTIONS.map((option) => {
          const active = option.id === value;
          return (
            <TouchableOpacity
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              activeOpacity={0.82}
              disabled={disabled}
              onPress={() => onChange(option.id)}
              style={{
                minHeight: 38,
                borderRadius: BorderRadius.full,
                paddingHorizontal: Spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: active ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
                opacity: disabled ? 0.55 : 1,
              }}
            >
              {option.id === 'all' ? (
                <MaterialCommunityIcons
                  name="database-search-outline"
                  size={14}
                  color={active ? colors.textInverse : colors.textSecondary}
                />
              ) : null}
              <Text
                style={{
                  fontSize: Typography.fontSize.xs,
                  fontFamily: Typography.fontFamily.medium,
                  color: active ? colors.textInverse : colors.textSecondary,
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
