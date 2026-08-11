import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { glassBackdropStyle } from '@/utils/glassStyle';
import { useReportingMonth } from './ReportingMonthContext';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  index,
  label: format(new Date(2026, index, 1), 'MMM'),
  fullLabel: format(new Date(2026, index, 1), 'MMMM'),
}));

const toMonthKey = (year: number, monthIndex: number) => `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

const getMonthYear = (monthKey: string) => {
  const year = Number(monthKey.slice(0, 4));
  return Number.isFinite(year) ? year : new Date().getFullYear();
};

export const isFutureReportingMonth = (monthKey: string, currentMonthKey: string) =>
  monthKey > currentMonthKey;

export const isNextReportingYearDisabled = (visibleYear: number, currentMonthKey: string) =>
  visibleYear >= getMonthYear(currentMonthKey);

type ReportingMonthPickerProps = {
  compact?: boolean;
};

export function ReportingMonthPicker({ compact = false }: ReportingMonthPickerProps) {
  const { colors } = useTheme();
  const {
    currentMonthKey,
    monthRangeLabel,
    resetToCurrentMonth,
    selectedMonthKey,
    selectMonth,
  } = useReportingMonth();
  const [open, setOpen] = useState(false);
  const [visibleYear, setVisibleYear] = useState(() => getMonthYear(selectedMonthKey));
  const triggerRef = useRef<React.ElementRef<typeof Pressable>>(null);
  const restoreFocusOnCloseRef = useRef(false);

  const closeAndRestoreFocus = useCallback(() => {
    restoreFocusOnCloseRef.current = true;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (open || !restoreFocusOnCloseRef.current) {
      return;
    }

    restoreFocusOnCloseRef.current = false;
    triggerRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      closeAndRestoreFocus();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeAndRestoreFocus, open]);

  const toggle = () => {
    if (open) {
      closeAndRestoreFocus();
      return;
    }

    setVisibleYear(getMonthYear(selectedMonthKey));
    setOpen(true);
  };

  const handleSelectMonth = (monthKey: string) => {
    selectMonth(monthKey);
    closeAndRestoreFocus();
  };

  const handleResetToCurrentMonth = () => {
    resetToCurrentMonth();
    setVisibleYear(getMonthYear(currentMonthKey));
    closeAndRestoreFocus();
  };

  const popoverStyle: StyleProp<ViewStyle> = compact
    ? { top: 52, left: 0, right: 0 }
    : { top: 54, right: 0, width: 340 };

  return (
    <View style={{ position: 'relative', zIndex: 60, overflow: 'visible' }}>
      {open ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close reporting month picker"
          onPress={closeAndRestoreFocus}
          style={{
            position: 'absolute',
            top: -10000,
            right: -10000,
            bottom: -10000,
            left: -10000,
            zIndex: 20,
          }}
        />
      ) : null}

      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel="Choose reporting month"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={({ hovered, pressed }: any) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: compact ? 'space-between' : undefined,
          gap: compact ? Spacing.sm : 8,
          backgroundColor: hovered ? colors.surfaceElevated : 'transparent',
          borderWidth: 1,
          borderColor: hovered ? `${colors.primary}38` : colors.borderLight,
          borderRadius: BorderRadius.md,
          paddingHorizontal: Spacing.md,
          paddingVertical: compact ? 11 : 10,
          transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
          position: 'relative',
          zIndex: 30,
        })}
      >
        {compact ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, minWidth: 0 }}>
            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.textPrimary} />
            <Text
              style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 20, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}
              numberOfLines={1}
            >
              {monthRangeLabel}
            </Text>
          </View>
        ) : (
          <>
            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.textPrimary} />
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
              {monthRangeLabel}
            </Text>
          </>
        )}
        <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>

      {open ? (
        <MonthYearPickerPopover
          currentMonthKey={currentMonthKey}
          onChangeYear={setVisibleYear}
          onClose={closeAndRestoreFocus}
          onResetToCurrentMonth={handleResetToCurrentMonth}
          onSelect={handleSelectMonth}
          selectedMonthKey={selectedMonthKey}
          style={popoverStyle}
          visibleYear={visibleYear}
        />
      ) : null}
    </View>
  );
}

type MonthYearPickerPopoverProps = {
  selectedMonthKey: string;
  currentMonthKey: string;
  visibleYear: number;
  onChangeYear: (year: number) => void;
  onSelect: (monthKey: string) => void;
  onResetToCurrentMonth: () => void;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
};

function MonthYearPickerPopover({
  selectedMonthKey,
  currentMonthKey,
  visibleYear,
  onChangeYear,
  onSelect,
  onResetToCurrentMonth,
  onClose,
  style,
}: MonthYearPickerPopoverProps) {
  const { colors } = useTheme();
  const nextYearDisabled = isNextReportingYearDisabled(visibleYear, currentMonthKey);
  const dialogRef = useRef<React.ElementRef<typeof View>>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <View
      ref={dialogRef}
      role="dialog"
      accessibilityLabel="Reporting month picker"
      tabIndex={-1}
      style={[
        {
          position: 'absolute',
          backgroundColor: colors.glassBg,
          borderRadius: BorderRadius.lg,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          ...Shadows.lg,
          shadowColor: colors.shadowColor,
          padding: Spacing.md,
          zIndex: 40,
          gap: Spacing.md,
          overflow: 'hidden',
          ...(glassBackdropStyle ?? {}),
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous year"
          onPress={() => onChangeYear(visibleYear - 1)}
          style={({ hovered, pressed }: any) => ({
            width: 38,
            height: 38,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
            borderWidth: 1,
            borderColor: hovered ? `${colors.primary}40` : colors.glassBorder,
            transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
          })}
        >
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
          <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 24, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
            {visibleYear}
          </Text>
          <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, lineHeight: 16, color: colors.textSecondary }}>
            Select reporting month
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next year"
          accessibilityState={{ disabled: nextYearDisabled }}
          disabled={nextYearDisabled}
          onPress={() => onChangeYear(visibleYear + 1)}
          style={({ hovered, pressed }: any) => ({
            width: 38,
            height: 38,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: !nextYearDisabled && hovered ? colors.surfaceElevated : colors.glassBg,
            borderWidth: 1,
            borderColor: !nextYearDisabled && hovered ? `${colors.primary}40` : colors.glassBorder,
            opacity: nextYearDisabled ? 0.45 : 1,
            transform: !nextYearDisabled && hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
          })}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={nextYearDisabled ? colors.textTertiary : colors.textPrimary}
          />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        {MONTH_OPTIONS.map((month) => {
          const monthKey = toMonthKey(visibleYear, month.index);
          const active = monthKey === selectedMonthKey;
          const isCurrent = monthKey === currentMonthKey;
          const disabled = isFutureReportingMonth(monthKey, currentMonthKey);

          return (
            <Pressable
              key={monthKey}
              accessibilityRole="button"
              accessibilityLabel={`Show ${month.fullLabel} ${visibleYear}`}
              accessibilityState={{ disabled, selected: active }}
              disabled={disabled}
              onPress={() => onSelect(monthKey)}
              style={({ hovered, pressed }: any) => ({
                width: '31.4%',
                minHeight: 58,
                borderRadius: BorderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                backgroundColor: active ? colors.primary : !disabled && hovered ? `${colors.primary}10` : colors.glassBg,
                borderWidth: 1,
                borderColor: active ? colors.primary : isCurrent ? colors.primaryLight : colors.glassBorder,
                opacity: disabled ? 0.45 : 1,
                transform: !disabled && hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
              })}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  lineHeight: 20,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: active ? colors.textInverse : disabled ? colors.textTertiary : colors.textPrimary,
                }}
              >
                {month.label}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: Typography.fontSize.xs,
                  lineHeight: 16,
                  color: active ? colors.textInverse : isCurrent ? colors.primary : colors.textTertiary,
                }}
              >
                {isCurrent ? 'Current' : month.fullLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <Button
          title="Current Month"
          icon="calendar-today-outline"
          variant="outline"
          size="sm"
          onPress={onResetToCurrentMonth}
          style={{ flex: 1 }}
        />
        <Button
          title="Done"
          icon="check"
          size="sm"
          onPress={onClose}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
