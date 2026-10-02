import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, TransactionDirectionColor, Typography } from '@/constants/theme';
import { buildCalendarDays, fromLocalDateKey, toLocalDateKey } from '@/utils/calendarDates';
import { CalendarPeriodMenu } from './CalendarPeriodMenu';
import { boundedMonth, clampCalendarDate, monthAvailable } from './calendarModel';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function CalendarSurface({ value, minimum, maximum, onSelect, monthOnly = false }: { value: string | null; minimum?: string; maximum?: string; onSelect: (key: string) => void; monthOnly?: boolean }) {
  const { colors } = useTheme();
  const selected = clampCalendarDate(value, minimum, maximum);
  const [month, setMonth] = useState(() => fromLocalDateKey(selected)!);
  const [periodMenu, setPeriodMenu] = useState(false);
  const today = toLocalDateKey(new Date());
  useEffect(() => { setMonth(fromLocalDateKey(selected)!); }, [selected]);
  const days = useMemo(() => buildCalendarDays(month.getFullYear(), month.getMonth()), [month]);
  const moveMonth = (offset: number) => {
    const year = month.getFullYear(); const index = month.getMonth() + offset;
    if (!monthAvailable(year, index, minimum, maximum)) return;
    const next = boundedMonth(year, index, minimum, maximum);
    setMonth(next);
    if (monthOnly) onSelect(clampCalendarDate(toLocalDateKey(next), minimum, maximum));
  };
  const chooseMonth = (next: Date) => {
    setMonth(next); setPeriodMenu(false);
    if (monthOnly) onSelect(clampCalendarDate(toLocalDateKey(next), minimum, maximum));
  };
  const todayAllowed = (!minimum || today >= minimum) && (!maximum || today <= maximum);
  return <View testID="shared-calendar-surface" style={[styles.surface, { backgroundColor: colors.card }]}>
    <View style={styles.header}>
      <PressableScale accessibilityRole="button" accessibilityLabel="Previous month" disabled={!monthAvailable(month.getFullYear(), month.getMonth() - 1, minimum, maximum)} onPress={() => moveMonth(-1)} style={styles.arrow}><AppIcon name="chevron-left" size={20} color={colors.textPrimary} /></PressableScale>
      <PressableScale accessibilityRole="button" accessibilityLabel="Choose month and year" accessibilityState={{ expanded: periodMenu }} onPress={() => setPeriodMenu(!periodMenu)} style={styles.headingButton}>
        <Text accessibilityRole="header" style={[styles.heading, { color: colors.textPrimary }]}>{month.toLocaleDateString('en-IN', { month: 'short' })}, {month.getFullYear()}</Text>
        <AppIcon name={periodMenu ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
      </PressableScale>
      <PressableScale accessibilityRole="button" accessibilityLabel="Next month" disabled={!monthAvailable(month.getFullYear(), month.getMonth() + 1, minimum, maximum)} onPress={() => moveMonth(1)} style={styles.arrow}><AppIcon name="chevron-right" size={20} color={colors.textPrimary} /></PressableScale>
    </View>
    <View style={styles.toolbar}>
      <PressableScale accessibilityRole="button" accessibilityLabel={monthOnly ? 'Select current month' : 'Select today'} accessibilityState={{ disabled: !todayAllowed }} disabled={!todayAllowed} onPress={() => { setMonth(fromLocalDateKey(today)!); onSelect(today); setPeriodMenu(false); }} style={[styles.today, { borderColor: colors.borderLight }]}><Text style={{ color: todayAllowed ? colors.textPrimary : colors.textTertiary, fontSize: Typography.fontSize.sm }}>{monthOnly ? 'This month' : 'Today'}</Text></PressableScale>
    </View>
    {periodMenu ? <CalendarPeriodMenu month={month} minimum={minimum} maximum={maximum} onSelect={chooseMonth} /> : <>
      <View style={styles.week}>{WEEKDAYS.map(day => <Text key={day} style={[styles.weekday, { color: colors.textSecondary }]}>{day}</Text>)}</View>
      {Array.from({ length: days.length / 7 }, (_, week) => <View key={week} style={styles.week}>
        {days.slice(week * 7, week * 7 + 7).map(day => {
          if (!day.inCurrentMonth) return <View key={day.key} style={styles.emptyDay} />;
          const disabled = Boolean((minimum && day.key < minimum) || (maximum && day.key > maximum));
          const active = monthOnly ? day.key.slice(0, 7) === selected.slice(0, 7) : day.key === selected;
          return <PressableScale key={day.key} accessibilityRole="button" accessibilityLabel={day.date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} accessibilityState={{ selected: active, disabled }} disabled={disabled} onPress={() => onSelect(day.key)} style={styles.daySlot}>
            <View style={[styles.day, { borderColor: active && (!monthOnly || day.date.getDate() === 1) ? colors.textPrimary : 'transparent', backgroundColor: active && !monthOnly ? colors.surfaceElevated : 'transparent' }]}><Text style={{ color: disabled ? colors.textTertiary : day.key === today ? TransactionDirectionColor.debit : colors.textPrimary, fontFamily: active ? Typography.fontFamily.semiBold : Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>{day.date.getDate()}</Text></View>
          </PressableScale>;
        })}
      </View>)}
    </>}
  </View>;
}
const styles = StyleSheet.create({
  surface: { borderRadius: BorderRadius.lg, padding: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headingButton: { flexDirection: 'row', gap: Spacing.sm, flexShrink: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  heading: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, flexShrink: 1 },
  toolbar: { flexDirection: 'row', marginVertical: Spacing.sm },
  today: { minHeight: 44, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm, borderWidth: 1, justifyContent: 'center' },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, fontSize: Typography.fontSize.xs, textAlign: 'center', paddingVertical: Spacing.sm },
  emptyDay: { flex: 1, minHeight: 48 },
  daySlot: { flex: 1, minHeight: 48, alignItems: 'stretch', justifyContent: 'center' },
  day: { minHeight: 44, marginHorizontal: 2, borderWidth: 1, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
});
