import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { addYears } from 'date-fns/addYears';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { subYears } from 'date-fns/subYears';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

interface MonthYearPickerSheetProps {
  visible: boolean;
  selectedMonthKey: string;
  onSelect: (monthKey: string) => void;
  onClose: () => void;
  onResetToCurrentMonth: () => void;
}

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  index,
  label: format(new Date(2026, index, 1), 'MMM'),
  fullLabel: format(new Date(2026, index, 1), 'MMMM'),
}));

const toMonthKey = (year: number, monthIndex: number) => `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

export const MonthYearPickerSheet = ({
  visible,
  selectedMonthKey,
  onSelect,
  onClose,
  onResetToCurrentMonth,
}: MonthYearPickerSheetProps) => {
  const { colors } = useTheme();
  const selectedDate = useMemo(() => parseISO(`${selectedMonthKey}-01`), [selectedMonthKey]);
  const selectedYear = selectedDate.getFullYear();
  const [visibleYearOverride, setVisibleYearOverride] = useState<number | null>(null);
  const visibleYear = visibleYearOverride ?? selectedYear;
  const currentMonthKey = format(new Date(), 'yyyy-MM');

  const changeYear = (direction: 'previous' | 'next') => {
    const base = new Date(visibleYear, 0, 1);
    setVisibleYearOverride((direction === 'previous' ? subYears(base, 1) : addYears(base, 1)).getFullYear());
  };

  const handleClose = () => {
    setVisibleYearOverride(null);
    onClose();
  };

  const handleResetToCurrentMonth = () => {
    setVisibleYearOverride(null);
    onResetToCurrentMonth();
  };

  return (
    <ModalSheet
      visible={visible}
      title="Select Month"
      subtitle="Choose any month or year for dashboard and budget analytics."
      onClose={handleClose}
      maxHeight={560}
      footer={
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
          <Button title="Current Month" icon="calendar-today-outline" variant="outline" onPress={handleResetToCurrentMonth} style={{ flex: 1 }} />
          <Button title="Done" icon="check" onPress={handleClose} style={{ flex: 1 }} />
        </View>
      }
    >
      <View style={{ gap: Spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Previous year"
            activeOpacity={0.8}
            onPress={() => changeYear('previous')}
            style={{
              width: 42,
              height: 42,
              borderRadius: BorderRadius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
            {visibleYear}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Next year"
            activeOpacity={0.8}
            onPress={() => changeYear('next')}
            style={{
              width: 42,
              height: 42,
              borderRadius: BorderRadius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {MONTHS.map((month) => {
            const monthKey = toMonthKey(visibleYear, month.index);
            const active = monthKey === selectedMonthKey;
            const isCurrent = monthKey === currentMonthKey;
            return (
              <TouchableOpacity
                key={monthKey}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                activeOpacity={0.82}
                onPress={() => onSelect(monthKey)}
                style={{
                  width: '31.4%',
                  minHeight: 62,
                  borderRadius: BorderRadius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : isCurrent ? colors.primaryLight : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: active ? colors.textInverse : colors.textPrimary,
                  }}
                >
                  {month.label}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: Typography.fontSize.xs,
                    color: active ? colors.textInverse : isCurrent ? colors.primary : colors.textTertiary,
                  }}
                >
                  {isCurrent ? 'Current' : month.fullLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ModalSheet>
  );
};
