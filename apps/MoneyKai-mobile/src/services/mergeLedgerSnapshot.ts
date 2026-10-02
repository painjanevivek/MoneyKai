import { useAuthStore } from '@/stores/useAuthStore';
import { useLocalLedgerStore } from '@/stores/useLocalLedgerStore';
import { captureRemoteSyncSession,isRemoteSyncSessionCurrent } from '@moneykai/domain/syncSession';
import { isCloudApprovedSmsTransaction } from '@moneykai/domain/transactionImports';
import type { Transaction } from '@/types/transaction';
import { ledgerRequest } from './localLedger';

export async function mergeLedgerSnapshot(rows:Transaction[]) {
  const owner=useAuthStore.getState().user?.id;
  if(!owner)throw new Error('Owner unavailable');
  const session=captureRemoteSyncSession(owner);
  for(let offset=0;offset<rows.length;offset+=50) {
    if(!isRemoteSyncSessionCurrent(session,useAuthStore.getState().user?.id))throw new Error('Session changed');
    const approved=rows.slice(offset,offset+50).filter(r=>r.user_id===owner && r.captureSource!=='notification' && (r.captureSource!=='sms' || isCloudApprovedSmsTransaction(r)));
    await ledgerRequest(owner,{op:'mergeSnapshot',rows:approved});
  }
  if(isRemoteSyncSessionCurrent(session,useAuthStore.getState().user?.id)) await Promise.all([
    useLocalLedgerStore.getState().queryTransactions(),useLocalLedgerStore.getState().refreshOverview(),
  ]);
}
