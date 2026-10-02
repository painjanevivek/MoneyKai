import { useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionPreferencesStore } from '@/stores/useTransactionPreferencesStore';
import { counterpartyAliasKey } from '@/utils/transactionPreferences';
import { transactionDisplayName } from '@/utils/counterpartyName';
import type { Transaction } from '@/types/transaction';

export function useTransactionLabels() {
  const owner = useAuthStore(state => state.user?.id);
  const aliases = useTransactionPreferencesStore(state => owner ? state.aliases[owner] : undefined);
  return useCallback((transaction: Transaction) =>
    transaction.user_id === owner ? aliases?.[counterpartyAliasKey(transaction)] || transactionDisplayName(transaction) : transactionDisplayName(transaction), [aliases, owner]);
}
