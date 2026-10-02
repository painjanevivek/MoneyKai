import React from 'react';
import { View } from 'react-native';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Disclosure } from '@/components/ui/Disclosure';
import { Button } from '@/components/ui/Button';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Spacing, Typography, TransactionDirectionColor } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { ActivityDateRange } from './ActivityDateRange';
import { activityDateError, activityDateLabel, type ActivityDates } from '@/utils/activityDates';
import type { TransactionType } from '@/types/transaction';
import type { TransactionHistorySortOption } from '@/utils/transactionHistory';

export const ACTIVITY_SORT_OPTIONS: { id: TransactionHistorySortOption; label: string; icon: string }[] = [
  { id: 'newest', label: 'Newest first', icon: 'sort-calendar-descending' }, { id: 'oldest', label: 'Oldest first', icon: 'sort-calendar-ascending' },
  { id: 'amount_high', label: 'Highest amount', icon: 'sort-numeric-descending' }, { id: 'amount_low', label: 'Lowest amount', icon: 'sort-numeric-ascending' },
  { id: 'name_az', label: 'Name A–Z', icon: 'sort-alphabetical-ascending' }, { id: 'name_za', label: 'Name Z–A', icon: 'sort-alphabetical-descending' },
];
type Field = { title: string; value: string; options: { id: string; name: string }[]; onChange: (id: string) => void };
type Props = { onClose: () => void; onReset: () => void; dates: ActivityDates; onDates: (dates: ActivityDates) => void; type: TransactionType | 'all'; onType: (type: TransactionType | 'all') => void; sort: TransactionHistorySortOption; onSort: (sort: TransactionHistorySortOption) => void; fields: Field[] };

export function ActivityControlsSheet({ onClose, onReset, dates, onDates, type, onType, sort, onSort, fields }: Props) {
  const { colors } = useTheme();
  return <ModalSheet visible title="Filter & sort" onClose={onClose} footer={<View style={{ flexDirection: 'row', gap: Spacing.sm }}><Button title="Reset" variant="outline" onPress={onReset} style={{ flex: 1 }} /><Button title="Done" disabled={Boolean(activityDateError(dates))} onPress={onClose} style={{ flex: 1 }} /></View>}>
    <Disclosure title="Date range" summary={activityDateLabel(dates)} defaultOpen><ActivityDateRange value={dates} onChange={onDates} /></Disclosure>
    <Disclosure title="Transaction type" summary={type === 'all' ? 'Debit & Credit' : type === 'expense' ? 'Debit' : 'Credit'}>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>{(['all', 'expense', 'income'] as const).map(item => <PressableScale key={item} accessibilityRole="radio" accessibilityState={{ checked: type === item }} onPress={() => onType(item)} style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated }}><Text style={{ color: item === 'all' ? colors.textPrimary : item === 'income' ? TransactionDirectionColor.credit : TransactionDirectionColor.debit, fontFamily: type === item ? Typography.fontFamily.bold : Typography.fontFamily.regular }}>{type === item ? '✓ ' : ''}{item === 'all' ? 'All' : item === 'expense' ? 'Debit' : 'Credit'}</Text></PressableScale>)}</View>
    </Disclosure>
    <Disclosure title="Sort by" summary={ACTIVITY_SORT_OPTIONS.find(option => option.id === sort)?.label}>
      {ACTIVITY_SORT_OPTIONS.map(option => <PressableScale key={option.id} accessibilityRole="radio" accessibilityState={{ checked: sort === option.id }} onPress={() => onSort(option.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}><AppIcon name={option.icon} size={20} color={colors.textSecondary} /><Text style={{ flex: 1, color: colors.textPrimary }}>{option.label}</Text>{sort === option.id ? <AppIcon name="check" size={20} color={colors.textPrimary} /> : null}</PressableScale>)}
    </Disclosure>
    {fields.filter(field => field.options.length > 1).map(field => <Disclosure key={field.title} title={field.title} summary={field.options.find(option => option.id === field.value)?.name ?? 'All'}><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>{field.options.map(option => <PressableScale key={option.id} accessibilityRole="radio" accessibilityState={{ checked: field.value === option.id }} onPress={() => field.onChange(option.id)} style={{ minHeight: 44, paddingHorizontal: Spacing.md, justifyContent: 'center', backgroundColor: field.value === option.id ? colors.primary : colors.surfaceElevated }}><Text style={{ color: field.value === option.id ? colors.textInverse : colors.textPrimary }}>{option.name}</Text></PressableScale>)}</View></Disclosure>)}
  </ModalSheet>;
}
