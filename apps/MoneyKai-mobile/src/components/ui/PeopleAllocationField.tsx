import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText as Text } from './AppText';
import { AppIcon } from './AppIcon';
import { ContactPickerModal } from './ContactPickerModal';
import { PressableScale } from './PressableScale';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { allocateContacts, summarizePeople } from '@/utils/contactAllocations';
import type { SelectedPerson, SplitMode } from '@/utils/contactAllocations';

export function PeopleAllocationField({ amount, currencySymbol, people, onPeopleChange, mode, onModeChange, customAmounts, onCustomAmountsChange }: {
  amount: string;
  currencySymbol: string;
  people: SelectedPerson[];
  onPeopleChange: (people: SelectedPerson[]) => void;
  mode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
  customAmounts: Record<string, string>;
  onCustomAmountsChange: (amounts: Record<string, string>) => void;
}) {
  const { colors } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(false);
  const equal = allocateContacts(amount, people, 'equal', {});
  const changeMode = (next: SplitMode) => {
    if (next === 'custom' && mode !== 'custom' && equal.allocations) {
      onCustomAmountsChange({
        ...Object.fromEntries(equal.allocations.map((allocation) => [allocation.contactId, allocation.amount.toFixed(2)])),
        ...customAmounts,
      });
    }
    onModeChange(next);
  };
  const changePeople = (next: SelectedPerson[]) => {
    onCustomAmountsChange(Object.fromEntries(Object.entries(customAmounts).filter(([id]) => next.some((person) => person.contactId === id))));
    onPeopleChange(next);
    setPickerVisible(false);
  };

  return <>
    <PressableScale accessibilityRole="button" accessibilityLabel={people.length ? `People, ${people.map((person) => person.name).join(', ')}` : 'Add people to this transaction'} onPress={() => setPickerVisible(true)} style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppIcon name="account-group-outline" size={20} color={people.length ? colors.textPrimary : colors.textSecondary} />
      <View style={{ flex: 1, minWidth: 0 }}>
        {people.length ? <Text style={[styles.overline, { color: colors.textSecondary }]}>PEOPLE</Text> : null}
        <Text numberOfLines={1} style={[styles.value, { color: people.length ? colors.textPrimary : colors.textSecondary }]}>{summarizePeople(people)}</Text>
      </View>
      <AppIcon name="chevron-right" size={18} color={colors.textSecondary} />
    </PressableScale>
    {people.length > 1 ? <View style={[styles.splitPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.splitHeader}>
        <Text style={[styles.splitTitle, { color: colors.textPrimary }]}>Split between people</Text>
        <View style={[styles.segment, { backgroundColor: colors.surfaceElevated }]}>
          {(['equal', 'custom'] as const).map((choice) => <PressableScale key={choice} accessibilityRole="button" accessibilityState={{ selected: mode === choice }} onPress={() => changeMode(choice)} style={[styles.segmentOption, mode === choice && { backgroundColor: colors.textPrimary }]}>
            <Text style={[styles.segmentText, { color: mode === choice ? colors.card : colors.textSecondary }]}>{choice === 'equal' ? 'Equal' : 'Custom'}</Text>
          </PressableScale>)}
        </View>
      </View>
      {people.map((person, index) => <View key={person.contactId} style={[styles.allocationRow, index > 0 && { borderTopColor: colors.borderLight, borderTopWidth: StyleSheet.hairlineWidth }]}>
        <Text numberOfLines={1} style={[styles.personName, { color: colors.textPrimary }]}>{person.name}</Text>
        {mode === 'equal' ? <Text style={[styles.amountText, { color: colors.textPrimary }]}>{equal.allocations ? `${currencySymbol}${equal.allocations[index].amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</Text>
          : <View style={[styles.customInputBox, { borderColor: colors.border }]}><Text style={[styles.currency, { color: colors.textSecondary }]}>{currencySymbol}</Text><TextInput accessibilityLabel={`Amount for ${person.name}`} keyboardType="decimal-pad" inputMode="decimal" value={customAmounts[person.contactId] ?? ''} onChangeText={(value) => onCustomAmountsChange({ ...customAmounts, [person.contactId]: value })} placeholder="0.00" placeholderTextColor={colors.textTertiary} style={[styles.customInput, { color: colors.textPrimary }]} /></View>}
      </View>)}
      <Text style={[styles.helper, { color: colors.textSecondary }]}>{mode === 'equal' ? 'Any remaining paisa goes to the first person.' : 'Each amount must be positive, and together they must equal the transaction total.'}</Text>
    </View> : null}
    <ContactPickerModal visible={pickerVisible} selected={people} onApply={changePeople} onClose={() => setPickerVisible(false)} />
  </>;
}

const styles = StyleSheet.create({
  field: { alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, minHeight: 64, paddingHorizontal: Spacing.md },
  overline: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, letterSpacing: 0.7, marginBottom: 2 },
  value: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md },
  splitPanel: { borderRadius: BorderRadius.md, borderWidth: 1, marginTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  splitHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, paddingVertical: Spacing.sm },
  splitTitle: { flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md },
  segment: { borderRadius: BorderRadius.full, flexDirection: 'row', padding: 3 },
  segmentOption: { borderRadius: BorderRadius.full, justifyContent: 'center', minHeight: 36, minWidth: 62, paddingHorizontal: Spacing.sm },
  segmentText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, textAlign: 'center' },
  allocationRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md, minHeight: 50 },
  personName: { flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md },
  amountText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md },
  customInputBox: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', minWidth: 105 },
  currency: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md },
  customInput: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md, minWidth: 75, paddingVertical: Spacing.sm, textAlign: 'right' },
  helper: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, lineHeight: 18, paddingBottom: Spacing.sm, paddingTop: Spacing.xs },
});
