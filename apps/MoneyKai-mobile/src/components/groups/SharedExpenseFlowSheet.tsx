import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppDatePicker as DateTimePicker, type AppDatePickerEvent as DateTimePickerEvent } from '@/components/calendar/AppDatePicker';
import { AppIcon as MaterialCommunityIcons } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ContactPickerModal } from '@/components/ui/ContactPickerModal';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Group, GroupExpense } from '@/types/group';
import type { Transaction } from '@/types/transaction';
import {
  createClientMutationId,
  describeBalance,
  formatPaise,
  parseRupeesToPaise,
  splitPaiseExactly,
} from '@/utils/groupExpense';

interface SharedExpenseFlowSheetProps {
  visible: boolean;
  group?: Group;
  currentUser: { id: string; name: string };
  currencySymbol: string;
  initialTransaction?: Transaction;
  onClose: () => void;
  onAdd: (expense: Omit<GroupExpense, 'id' | 'created_at'>) => void | Promise<GroupExpense>;
  onAddPeople: (groupId: string, names: string[]) => Promise<void>;
}

type Stage = 'details' | 'review';

export function SharedExpenseFlowSheet({ visible, group, currentUser, currencySymbol, initialTransaction, onClose, onAdd, onAddPeople }: SharedExpenseFlowSheetProps) {
  const { colors } = useTheme();
  const [stage, setStage] = useState<Stage>('details');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState(currentUser.id);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [mutationId, setMutationId] = useState(() => createClientMutationId('expense'));
  const [occurredOn, setOccurredOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [peoplePickerVisible, setPeoplePickerVisible] = useState(false);
  const [addingPeople, setAddingPeople] = useState(false);
  const members = useMemo(() => {
    const stored = group?.members ?? [];
    if (stored.some((member) => member.user_id === currentUser.id)) return stored;
    return [{ id: `member_${currentUser.id}`, group_id: group?.id ?? '', user_id: currentUser.id, role: 'admin' as const, joined_at: new Date().toISOString(), user_name: currentUser.name }, ...stored];
  }, [currentUser.id, currentUser.name, group]);
  const parsedAmount = parseRupeesToPaise(amount);
  const totalPaise = parsedAmount.ok ? parsedAmount.paise : 0;
  const previewSplits = splitPaiseExactly(totalPaise, members);
  const payer = members.find((member) => member.user_id === payerId) ?? members[0];
  const currentUserSharePaise = previewSplits.find((split) => split.user_id === currentUser.id)?.amount_paise ?? 0;
  const currentUserNetPaise = payer?.user_id === currentUser.id
    ? totalPaise - currentUserSharePaise
    : -currentUserSharePaise;
  const dateLabel = occurredOn === new Date().toISOString().slice(0, 10)
    ? 'Today'
    : new Date(`${occurredOn}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  useEffect(() => {
    if (visible) setPayerId(currentUser.id);
    else setError(undefined);
  }, [currentUser.id, visible]);

  useEffect(() => {
    if (!visible || !initialTransaction) return;
    setStage('details');
    setDescription(initialTransaction.description || 'Shared expense');
    setAmount(String(initialTransaction.amount));
    setOccurredOn(initialTransaction.transaction_date.slice(0, 10));
    setPayerId(currentUser.id);
    setMutationId(createClientMutationId('expense'));
    setError(undefined);
  }, [initialTransaction?.id, visible]);

  const validateDetails = (): boolean => {
    if (addingPeople || group?.pending_action === 'members') {
      setError('Wait for the added people to be confirmed, or retry the group update.');
      return false;
    }
    if (!description.trim()) {
      setError('Add a short description so everyone can recognize this expense.');
      return false;
    }
    if (!parsedAmount.ok) {
      setError(parsedAmount.error);
      return false;
    }
    if (members.length < 2) {
      setError('Add at least one other person before recording a shared expense.');
      return false;
    }
    setError(undefined);
    return true;
  };

  const reset = () => {
    setStage('details');
    setDescription('');
    setAmount('');
    setPayerId(currentUser.id);
    setError(undefined);
    setMutationId(createClientMutationId('expense'));
    setOccurredOn(new Date().toISOString().slice(0, 10));
    setDatePickerVisible(false);
    setPeoplePickerVisible(false);
  };

  const saveExpense = async () => {
    if (!group || !payer || submitting || !validateDetails()) return;
    setSubmitting(true);
    try {
      await onAdd({
        group_id: group.id,
        paid_by: payer.user_id,
        paid_by_name: payer.user_name || 'Payer',
        amount: totalPaise / 100,
        amount_paise: totalPaise,
        description: description.trim(),
        split_type: 'equal',
        occurred_on: occurredOn,
        mutation_id: mutationId,
        settlements: [],
        splits: previewSplits.map((split) => ({ ...split, is_settled: split.user_id === payer.user_id })),
      });
      reset();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The expense is retained. Retry without creating a duplicate.');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = stage === 'details' ? (
    <Button title="Review expense" icon="arrow-right" iconPosition="right" onPress={() => { if (validateDetails()) setStage('review'); }} fullWidth />
  ) : (
    <View style={{ gap: Spacing.sm }}>
      {error ? <Text accessibilityRole="alert" style={{ color: colors.error, fontSize: Typography.fontSize.xs, lineHeight: 18 }}>{error}</Text> : null}
      <Button title={error ? 'Retry saving expense' : 'Save expense'} icon="check" onPress={saveExpense} loading={submitting} fullWidth />
      <Button title="Edit details" variant="ghost" icon="pencil-outline" onPress={() => { setError(undefined); setStage('details'); }} disabled={submitting} fullWidth />
    </View>
  );

  return (
    <ModalSheet visible={visible} title={stage === 'details' ? 'Add expense' : 'Review expense'} subtitle={group?.name} onClose={() => { if (!submitting && !addingPeople) { setPeoplePickerVisible(false); onClose(); } }} footer={footer} maxHeight={790}>
      {stage === 'details' ? (
        <>
          {initialTransaction ? <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 18, marginBottom: Spacing.md }}>Filled from your tracked transaction. Saving creates a separate shared expense; your original transaction stays unchanged.</Text> : null}
          <Input label="Description" value={description} onChangeText={(value) => { setDescription(value); setError(undefined); }} placeholder="Expense description" icon="receipt-text-outline" error={error && !description.trim() ? error : undefined} maxLength={80} />
          <Input label="Amount" value={amount} onChangeText={(value) => { setAmount(value.replace(/[^0-9.,]/g, '')); setError(undefined); }} placeholder="0.00" prefix={currencySymbol} keyboardType="decimal-pad" />
          {error && description.trim() ? <Text accessibilityRole="alert" style={{ color: colors.error, fontSize: Typography.fontSize.xs, marginBottom: Spacing.md }}>{error}</Text> : null}

          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Expense date, ${dateLabel}`} onPress={() => setDatePickerVisible(true)} style={{ alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: BorderRadius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, minHeight: 56, marginBottom: Spacing.base, paddingHorizontal: Spacing.md }}>
            <MaterialCommunityIcons name="calendar-month-outline" color={colors.primaryDark} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>Date</Text>
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>{dateLabel}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" color={colors.textSecondary} size={20} />
          </TouchableOpacity>
          {datePickerVisible ? <DateTimePicker value={new Date(`${occurredOn}T12:00:00`)} mode="date" display="default" onChange={(event: DateTimePickerEvent, date?: Date) => { setDatePickerVisible(false); if (event.type === 'set' && date) setOccurredOn(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`); }} /> : null}

          <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, marginBottom: Spacing.sm }}>Paid by</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base }}>
            {members.map((member) => {
              const selected = member.user_id === payerId;
              return (
                <TouchableOpacity key={member.id} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`Paid by ${member.user_name || 'participant'}`} onPress={() => setPayerId(member.user_id)} style={{ backgroundColor: selected ? colors.primaryBg : colors.surface, borderColor: selected ? colors.primary : colors.border, borderRadius: BorderRadius.full, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: Spacing.md }}>
                  <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>{member.user_id === currentUser.id ? `${member.user_name || currentUser.name} (you)` : member.user_name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            title={group?.pending_action === 'members' ? 'Retry adding people' : 'Add another person'}
            icon="account-plus-outline" variant="outline" loading={addingPeople}
            onPress={() => {
              if (group?.pending_action !== 'members') { setPeoplePickerVisible(true); return; }
              setAddingPeople(true);
              void onAddPeople(group.id, []).then(() => setError(undefined)).catch(failure => setError(failure instanceof Error ? failure.message : 'Could not confirm the added people.')).finally(() => setAddingPeople(false));
            }}
            style={{ marginBottom: Spacing.base }}
          />
          <ContactPickerModal visible={visible && peoplePickerVisible} selected={[]} onClose={() => setPeoplePickerVisible(false)} onApply={people => {
            setPeoplePickerVisible(false);
            if (!group || !people.length) return;
            setAddingPeople(true);
            void onAddPeople(group.id, people.map(person => person.name)).then(() => setError(undefined)).catch(failure => setError(failure instanceof Error ? failure.message : 'Could not confirm the added people.')).finally(() => setAddingPeople(false));
          }} />

          <View style={{ backgroundColor: colors.surface, borderColor: colors.borderLight, borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.md }}>
            <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base }}>Split equally</Text>
            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 18, marginTop: 3 }}>MoneyKai allocates any remaining paise in the stable order shown below.</Text>
            <View style={{ backgroundColor: colors.borderLight, height: 1, marginVertical: Spacing.md }} />
            {!parsedAmount.ok ? <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>Enter an amount to preview exact shares.</Text> : members.map((member, index) => (
              <View key={member.id} style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: index === 0 ? 0 : Spacing.sm }}>
                <Text numberOfLines={1} style={{ color: colors.textSecondary, flex: 1, fontSize: Typography.fontSize.sm }}>{member.user_name || 'Participant'}</Text>
                <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, maxWidth: 120 }}>{formatPaise(previewSplits[index]?.amount_paise ?? 0, currencySymbol)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <>
          <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: BorderRadius.md, padding: Spacing.lg }}>
            <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['2xl'] }}>{description.trim()}</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['4xl'], marginTop: Spacing.xs }}>{formatPaise(totalPaise, currencySymbol)}</Text>
          </View>

          <ReviewRow label="Date" value={dateLabel} />
          <ReviewRow label="Paid by" value={payer?.user_id === currentUser.id ? `${payer?.user_name || currentUser.name} (you)` : payer?.user_name || 'Participant'} />
          <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, marginBottom: Spacing.sm, marginTop: Spacing.lg }}>Exact shares</Text>
          {previewSplits.map((split) => (
            <ReviewRow key={split.user_id} label={split.user_name || 'Participant'} value={formatPaise(split.amount_paise ?? 0, currencySymbol)} />
          ))}
          <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: BorderRadius.sm, borderWidth: 1, marginTop: Spacing.md, padding: Spacing.md }}>
            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>Reconciliation</Text>
            <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, marginTop: 4 }}>{previewSplits.map((split) => formatPaise(split.amount_paise ?? 0, currencySymbol)).join(' + ')} = {formatPaise(totalPaise, currencySymbol)}</Text>
          </View>
          <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, marginBottom: Spacing.sm, marginTop: Spacing.lg }}>Resulting balances</Text>
          {previewSplits.filter((split) => split.user_id !== payer?.user_id).map((split) => (
            <View key={split.user_id} accessible accessibilityLabel={describeBalance(split.user_name || 'Participant', payer?.user_name || 'Payer', split.amount_paise ?? 0, currentUser.id, split.user_id, payer?.user_id || '', currencySymbol)} style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm }}>
              <MaterialCommunityIcons name="arrow-right" color={colors.primaryDark} size={18} />
              <Text style={{ color: colors.textPrimary, flex: 1, fontSize: Typography.fontSize.sm }}>{describeBalance(split.user_name || 'Participant', payer?.user_name || 'Payer', split.amount_paise ?? 0, currentUser.id, split.user_id, payer?.user_id || '', currencySymbol)}</Text>
            </View>
          ))}
          {currentUserNetPaise !== 0 ? (
            <View style={{ borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm, minHeight: 48, paddingTop: Spacing.md }}>
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>{currentUserNetPaise > 0 ? 'You are owed' : 'You owe'}</Text>
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>{formatPaise(Math.abs(currentUserNetPaise), currencySymbol)}</Text>
            </View>
          ) : null}
        </>
      )}
    </ModalSheet>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', borderBottomColor: colors.borderLight, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48 }}>
      <Text style={{ color: colors.textSecondary, flex: 1, fontSize: Typography.fontSize.sm }}>{label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, maxWidth: '58%' }}>{value}</Text>
    </View>
  );
}
