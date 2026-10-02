import React from 'react';
import { CalendarDialog } from '@/components/calendar/CalendarDialog';
import { toLocalDateKey } from '@/utils/calendarDates';
export function TransactionCalendar({ visible, value, onClose, onSelect }: { visible: boolean; value: string | null; onClose: () => void; onSelect: (key: string) => void }) {
  return <CalendarDialog visible={visible} value={value} maximum={toLocalDateKey(new Date())} title="Choose transaction date" onClose={onClose} onSelect={onSelect} />;
}
