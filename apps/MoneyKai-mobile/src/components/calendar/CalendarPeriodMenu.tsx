import React, { useState } from 'react';
import { View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';
import { boundedMonth, monthAvailable } from './calendarModel';
export function CalendarPeriodMenu({ month, minimum, maximum, onSelect }: { month: Date; minimum?: string; maximum?: string; onSelect: (month: Date) => void }) {
  const { colors } = useTheme();
  const [year, setYear] = useState(month.getFullYear());
  const [years, setYears] = useState(false);
  const firstYear = minimum ? Number(minimum.slice(0, 4)) : 100;
  const lastYear = maximum ? Number(maximum.slice(0, 4)) : 9999;
  const page = Math.floor(year / 12) * 12;
  return <View style={{ gap: Spacing.sm }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <PressableScale accessibilityLabel={years ? 'Previous 12 years' : 'Previous year'} accessibilityRole="button" disabled={years ? page <= firstYear : year <= firstYear} onPress={() => setYear(Math.max(firstYear, year - (years ? 12 : 1)))} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="chevron-left" size={18} color={colors.textPrimary} /></PressableScale>
      <PressableScale accessibilityRole="button" accessibilityLabel="Choose year" onPress={() => setYears(!years)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md }}>{years ? `${Math.max(firstYear, page)}–${Math.min(lastYear, page + 11)}` : year}</Text></PressableScale>
      <PressableScale accessibilityLabel={years ? 'Next 12 years' : 'Next year'} accessibilityRole="button" disabled={years ? page + 11 >= lastYear : year >= lastYear} onPress={() => setYear(Math.min(lastYear, year + (years ? 12 : 1)))} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="chevron-right" size={18} color={colors.textPrimary} /></PressableScale>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {Array.from({ length: 12 }, (_, index) => {
        const candidate = years ? page + index : index;
        const disabled = years ? candidate < firstYear || candidate > lastYear : !monthAvailable(year, index, minimum, maximum);
        const label = years ? String(candidate) : new Date(2026, index, 1).toLocaleDateString('en-IN', { month: 'short' });
        return <PressableScale key={candidate} accessibilityRole="button" accessibilityLabel={years ? `Year ${candidate}` : `${label} ${year}`} accessibilityState={{ disabled }} disabled={disabled} onPress={() => {
          if (years) { setYear(candidate); setYears(false); } else onSelect(boundedMonth(year, index, minimum, maximum));
        }} style={{ width: '33.333%', minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: disabled ? colors.textTertiary : colors.textPrimary, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium }}>{label}</Text></PressableScale>;
      })}
    </View>
  </View>;
}
