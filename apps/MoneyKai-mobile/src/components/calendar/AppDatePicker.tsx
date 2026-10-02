import React from 'react';
import { fromLocalDateKey, toLocalDateKey } from '@/utils/calendarDates';
import { CalendarDialog } from './CalendarDialog';
export type AppDatePickerEvent = { type: 'set' | 'dismissed' };
/** Shared app-owned UI; this never invokes a native/system calendar. */
export function AppDatePicker({ value, minimumDate, maximumDate, onChange, title }: { value: Date; minimumDate?: Date; maximumDate?: Date; mode?: 'date'; display?: string; onChange: (event: AppDatePickerEvent, date?: Date) => void; title?: string }) {
  return <CalendarDialog visible value={toLocalDateKey(value)} minimum={minimumDate && toLocalDateKey(minimumDate)} maximum={maximumDate && toLocalDateKey(maximumDate)} title={title} onClose={() => onChange({ type: 'dismissed' })} onSelect={key => onChange({ type: 'set' }, fromLocalDateKey(key)!)} />;
}
