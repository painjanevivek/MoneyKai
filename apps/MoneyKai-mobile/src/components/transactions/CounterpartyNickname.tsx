import React, { useState } from 'react';
import { AppText as Text } from '@/components/ui/AppText';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTransactionPreferencesStore } from '@/stores/useTransactionPreferencesStore';
import { counterpartyAliasKey } from '@/utils/transactionPreferences';
import { useTheme } from '@/hooks/useTheme';
import type { Transaction } from '@/types/transaction';
import {saveTransactionNickname} from '@/services/transactionNickname';

export function CounterpartyNickname({ transaction }: { transaction: Transaction }) {
  const { colors } = useTheme();
  const existing = useTransactionPreferencesStore(state => state.aliases[transaction.user_id]?.[counterpartyAliasKey(transaction)] ?? '');
  const [name, setName] = useState(transaction.nickname ?? existing);
  const [busy,setBusy]=useState(false);
  const [notice, setNotice] = useState('');
  return <>
    <Input label="Nickname" placeholder="e.g. Akshay" value={name} onChangeText={setName} maxLength={100} autoCapitalize="words" />
    <Text style={{ color: colors.textSecondary }}>Saved with this transaction and used as a local default for this exact original name on future imports. The original description stays unchanged. Clear to remove.</Text>
    <Button title={busy?'Saving…':'Save nickname'} disabled={busy} variant="outline" onPress={async () => {
      setBusy(true);try{await saveTransactionNickname(transaction,name);setNotice('Nickname saved. It synchronizes with this transaction when cloud sync is available and permitted.');}
      catch{setNotice('Could not save. Your nickname input is preserved; try again.');}finally{setBusy(false);}
    }} />
    {notice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.textPrimary }}>{notice}</Text> : null}
  </>;
}
