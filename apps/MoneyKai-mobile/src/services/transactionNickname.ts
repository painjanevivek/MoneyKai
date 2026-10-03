import {normalizeTransactionNickname} from '@moneykai/domain/transactionImports';
import {useAuthStore} from '@/stores/useAuthStore';
import {useTransactionStore} from '@/stores/useTransactionStore';
import {useTransactionPreferencesStore} from '@/stores/useTransactionPreferencesStore';
import {counterpartyAliasKey} from '@/utils/transactionPreferences';
import type {Transaction} from '@/types/transaction';
import {LARGE_SMS_LOCAL_ENABLED} from '@/config/largeSmsFeatures';

/** Save the ledger value first; approved SMS uses its existing consent-controlled queue. */
export async function saveTransactionNickname(transaction:Transaction,value:string):Promise<void> {
  const nickname=normalizeTransactionNickname(value);
  if(useAuthStore.getState().user?.id!==transaction.user_id || !counterpartyAliasKey(transaction))throw new Error('Nickname owner changed');
  if(!LARGE_SMS_LOCAL_ENABLED && !useTransactionStore.getState().transactions.some(row=>row.id===transaction.id && row.user_id===transaction.user_id))throw new Error('Transaction unavailable');
  await useTransactionStore.getState().updateTransactionDurable(transaction.id,{nickname});
  if(useAuthStore.getState().user?.id!==transaction.user_id)throw new Error('Nickname owner changed');
  if(!useTransactionPreferencesStore.getState().setAlias(transaction,nickname))throw new Error('Nickname preference unavailable');
}
