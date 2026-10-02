import React, { useState } from 'react';
import { View } from 'react-native';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';
import { CalendarSurface } from './CalendarSurface';
import { clampCalendarDate } from './calendarModel';
interface Props { visible: boolean; value: string | null; onClose: () => void; onSelect: (key: string) => void; minimum?: string; maximum?: string; title?: string; monthOnly?: boolean }
export function CalendarDialog({ visible, ...props }: Props) {
  // Mount a fresh draft for each opening; navigation/cancellation never commits.
  return visible ? <CalendarDialogContent {...props} /> : null;
}
function CalendarDialogContent({ value, onClose, onSelect, minimum, maximum, title = 'Choose date', monthOnly = false }: Omit<Props, 'visible'>) {
  const [draft, setDraft] = useState(() => clampCalendarDate(value, minimum, maximum));
  return <ModalSheet visible title={title} onClose={onClose} maxHeight={740} expandable footer={<View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
    <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
    <Button title={monthOnly ? 'Use month' : 'Use date'} onPress={() => onSelect(clampCalendarDate(draft, minimum, maximum))} style={{ flex: 1 }} />
  </View>}>
    <CalendarSurface value={draft} minimum={minimum} maximum={maximum} onSelect={setDraft} monthOnly={monthOnly} />
  </ModalSheet>;
}
