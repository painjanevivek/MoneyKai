import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { AppDatePicker as DateTimePicker } from '@/components/calendar/AppDatePicker';
import { AppText as Text } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { ACTIVITY_DATE_OPTIONS, activityDateError, type ActivityDates } from '@/utils/activityDates';
import { fromLocalDateKey, toLocalDateKey } from '@/utils/calendarDates';

export function ActivityDateRange({ value, onChange }: { value: ActivityDates; onChange: (range: ActivityDates) => void }) {
  const { colors } = useTheme();
  const [calendar, setCalendar] = useState<'start' | 'end' | null>(null);
  const error = activityDateError(value);
  return <View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
      {ACTIVITY_DATE_OPTIONS.map(option => <PressableScale key={option.id} accessibilityRole="radio" accessibilityState={{ checked: value.id === option.id }} onPress={() => { onChange({ ...value, id: option.id }); setCalendar(option.id === 'custom' ? 'start' : null); }} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: value.id === option.id ? colors.primary : colors.surfaceElevated }}><Text style={{ color: value.id === option.id ? colors.textInverse : colors.textPrimary, fontSize: Typography.fontSize.sm }}>{option.label}</Text></PressableScale>)}
    </View>
    {value.id === 'custom' ? <>
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
        {(['start', 'end'] as const).map(field => <PressableScale key={field} accessibilityRole="button" accessibilityLabel={`Choose ${field === 'start' ? 'start' : 'end'} date, ${value[field]}`} onPress={() => setCalendar(field)} style={{ flex: 1, minHeight: 52, padding: Spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.sm }}><Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>{field === 'start' ? 'From' : 'To'}</Text><Text style={{ color: colors.textPrimary, fontSize: Typography.fontSize.sm }}>{value[field]}</Text></PressableScale>)}
      </View>
      {calendar ? <DateTimePicker title={calendar === 'start' ? 'From date' : 'To date'} value={fromLocalDateKey(value[calendar]) ?? new Date()} mode="date" display={Platform.OS === 'android' ? 'calendar' : 'inline'} maximumDate={new Date()} onChange={(event, date) => { const field = calendar; setCalendar(null); if (event.type === 'set' && date) onChange({ ...value, [field]: toLocalDateKey(date) }); }} /> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.error, marginTop: Spacing.sm }}>{error}</Text> : null}
    </> : null}
  </View>;
}
