import React, { useState } from 'react';
import { View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from './AppIcon';
import { Button } from './Button';
import { Disclosure } from './Disclosure';
import { Input } from './Input';
import { ModalSheet } from './ModalSheet';
import { PressableScale } from './PressableScale';
import { TransactionCalendar } from './TransactionCalendar';
import { PeopleAllocationField } from './PeopleAllocationField';
import { BorderRadius, Spacing, TransactionDirectionColor, Typography } from '@/constants/theme';
import { useTransactionPreferencesStore } from '@/stores/useTransactionPreferencesStore';
import { counterpartyAliasKey } from '@/utils/transactionPreferences';
import { useAuthStore } from '@/stores/useAuthStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import type { Transaction, TransactionType } from '@/types/transaction';
import { isAllowedTransactionDate } from '@/utils/calendarDates';
import { allocateContacts, summarizePeople } from '@/utils/contactAllocations';
import type { SelectedPerson, SplitMode } from '@/utils/contactAllocations';

const displayDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));

const validDate = isAllowedTransactionDate;

export function EditTransactionSheet({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const { colors } = useTheme();
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description);
  const [nickname, setNickname] = useState(() => useTransactionPreferencesStore.getState().aliases[transaction.user_id]?.[counterpartyAliasKey(transaction)] ?? '');
  const [category, setCategory] = useState(transaction.category);
  const [paymentMethod, setPaymentMethod] = useState(transaction.payment_method);
  const [date, setDate] = useState(transaction.transaction_date);
  const [people, setPeople] = useState<SelectedPerson[]>(() => transaction.contact_allocations?.map(({ contactId, name }) => ({ contactId, name })) ?? []);
  const [splitMode, setSplitMode] = useState<SplitMode>(transaction.contact_split_mode ?? 'equal');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => Object.fromEntries(transaction.contact_allocations?.map((item) => [item.contactId, item.amount.toFixed(2)]) ?? []));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const save = () => {
    if (useAuthStore.getState().user?.id !== transaction.user_id || !useTransactionStore.getState().transactions.some(item => item.id === transaction.id && item.user_id === transaction.user_id)) {
      setError('Your session or transaction changed. Reopen it from your account.'); return;
    }
    const numericAmount = Number(amount);
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim()) || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero, with up to two decimal places.');
      return;
    }
    if (!description.trim()) {
      setError('Add a description for this transaction.');
      return;
    }
    if (!validDate(date)) {
      setError('Choose a valid date that is not in the future.');
      return;
    }
    const allocation = allocateContacts(amount, people, splitMode, customAmounts);
    if (allocation.allocations === null) {
      setError(allocation.error);
      return;
    }
    setError(null);
    if (!useTransactionPreferencesStore.getState().setAlias(transaction, nickname)) { setError('Could not save the nickname. Try again.'); return; }
    updateTransaction(transaction.id, {
      type,
      amount: numericAmount,
      description: description.trim(),
      counterpartyName: transaction.counterpartyName ?? transaction.description,
      counterpartyKind: category === 'personal_transfer' ? 'person' : transaction.counterpartyKind,
      category,
      payment_method: paymentMethod,
      transaction_date: date,
      contact_allocations: allocation.allocations,
      contact_split_mode: people.length > 1 ? splitMode : 'equal',
    });
    if (transaction.captureSource === 'sms' && (category !== transaction.category || type !== transaction.type)) useCaptureStore.getState().learnSmsCategoryFromTransaction(transaction.id);
    onClose();
  };

  const selectType = (nextType: TransactionType) => {
    setType(nextType);
    setCategory((nextType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)[0].id);
    setError(null);
  };

  return (
    <>
    <ModalSheet visible title="Edit transaction" onClose={onClose} maxHeight={720} footer={<Button title="Save changes" icon="check" onPress={save} fullWidth />}>
      {error ? <Text accessibilityRole="alert" style={{ color: colors.error, fontSize: Typography.fontSize.sm, marginBottom: Spacing.md }}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        {(['expense', 'income'] as const).map((option) => {
          const active = type === option;
          return <PressableScale key={option} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => selectType(option)} style={{ alignItems: 'center', backgroundColor: active ? colors.primary : colors.surfaceElevated, borderRadius: BorderRadius.full, flex: 1, flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', minHeight: 44 }}>
            <AppIcon name={option === 'expense' ? 'arrow-up-right' : 'arrow-down-left'} color={active ? colors.textInverse : TransactionDirectionColor[option === 'expense' ? 'debit' : 'credit']} size={16} />
            <Text style={{ color: active ? colors.textInverse : TransactionDirectionColor[option === 'expense' ? 'debit' : 'credit'], fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>{option === 'expense' ? 'Debit' : 'Credit'}</Text>
          </PressableScale>;
        })}
      </View>
      <Input label="Amount" value={amount} onChangeText={(value) => { setAmount(value); setError(null); }} keyboardType="decimal-pad" inputMode="decimal" prefix={currencySymbol} />
      <Input label="Description" value={description} onChangeText={(value) => { setDescription(value); setError(null); }} multiline numberOfLines={2} maxLength={250} />
      <Disclosure title="Nickname" summary={nickname || 'Use a familiar display name'}>
        <Input label="Nickname" value={nickname} onChangeText={setNickname} maxLength={100} autoCapitalize="words" />
        <Text style={{ color: colors.textSecondary }}>Applies to matching past and future transactions, without changing the original source name.</Text>
      </Disclosure>
      <Disclosure title="Category" summary={categories.find((option) => option.id === category)?.name ?? 'Choose category'}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {categories.map((option) => {
            const active = category === option.id;
            return <PressableScale key={option.id} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setCategory(option.id)} style={{ alignItems: 'center', backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border, borderRadius: BorderRadius.full, borderWidth: 1, flexDirection: 'row', gap: Spacing.xs, minHeight: 44, paddingHorizontal: Spacing.md }}>
              <AppIcon name={option.icon} color={active ? colors.textInverse : colors.textSecondary} size={15} />
              <Text style={{ color: active ? colors.textInverse : colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>{option.name}</Text>
            </PressableScale>;
          })}
        </View>
      </Disclosure>
      <Disclosure title="People" summary={summarizePeople(people)}>
        <PeopleAllocationField
          amount={amount}
          currencySymbol={currencySymbol}
          people={people}
          onPeopleChange={(next) => { setPeople(next); setError(null); }}
          mode={splitMode}
          onModeChange={(next) => { setSplitMode(next); setError(null); }}
          customAmounts={customAmounts}
          onCustomAmountsChange={(next) => { setCustomAmounts(next); setError(null); }}
        />
      </Disclosure>
      <Disclosure title="Date & payment method" summary={`${validDate(date) ? displayDate(date) : date} · ${PAYMENT_METHODS.find((option) => option.id === paymentMethod)?.name ?? 'Payment method'}`}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Choose transaction date" onPress={() => setShowDatePicker(true)} style={{ alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: Spacing.sm, minHeight: 48 }}>
          <AppIcon name="calendar-month-outline" color={colors.textSecondary} size={18} />
          <Text style={{ color: colors.textPrimary, flex: 1, fontSize: Typography.fontSize.sm }}>{validDate(date) ? displayDate(date) : date}</Text>
          <AppIcon name="chevron-down" color={colors.textSecondary} size={18} />
        </PressableScale>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md }}>
          {PAYMENT_METHODS.map((option) => {
            const active = paymentMethod === option.id;
            return <PressableScale key={option.id} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setPaymentMethod(option.id)} style={{ alignItems: 'center', backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border, borderRadius: BorderRadius.full, borderWidth: 1, flexDirection: 'row', gap: Spacing.xs, minHeight: 44, paddingHorizontal: Spacing.md }}>
              <AppIcon name={option.icon} color={active ? colors.textInverse : colors.textSecondary} size={15} />
              <Text style={{ color: active ? colors.textInverse : colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>{option.name}</Text>
            </PressableScale>;
          })}
        </View>
      </Disclosure>
    </ModalSheet>
    <TransactionCalendar
      visible={showDatePicker}
      value={date}
      onClose={() => setShowDatePicker(false)}
      onSelect={(nextDate) => { setDate(nextDate); setError(null); setShowDatePicker(false); }}
    />
    </>
  );
}
