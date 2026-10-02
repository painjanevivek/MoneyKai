import React, { useState } from 'react';
import { AppText as Text } from '@/components/ui/AppText';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTransactionPreferencesStore } from '@/stores/useTransactionPreferencesStore';
import { counterpartyAliasKey } from '@/utils/transactionPreferences';
import { useTheme } from '@/hooks/useTheme';
import type { Transaction } from '@/types/transaction';

export function CounterpartyNickname({ transaction }: { transaction: Transaction }) {
  const { colors } = useTheme();
  const existing = useTransactionPreferencesStore(state => state.aliases[transaction.user_id]?.[counterpartyAliasKey(transaction)] ?? '');
  const [name, setName] = useState(existing);
  const [notice, setNotice] = useState('');
  return <>
    <Input label="Nickname" placeholder="e.g. Akshay" value={name} onChangeText={setName} maxLength={100} autoCapitalize="words" />
    <Text style={{ color: colors.textSecondary }}>Used for this exact saved name in past and future transactions. The original description stays unchanged. Clear to remove.</Text>
    <Button title="Save nickname" variant="outline" onPress={() => {
      setNotice(useTransactionPreferencesStore.getState().setAlias(transaction, name) ? 'Nickname updated.' : 'Could not save. Reopen this transaction from your account.');
    }} />
    {notice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.textPrimary }}>{notice}</Text> : null}
  </>;
}
