import React,{useState} from 'react';
import {View} from 'react-native';
import {AppText as Text} from '@/components/ui/AppText';
import {Button} from '@/components/ui/Button';
import {useTheme} from '@/hooks/useTheme';
import {useAuthStore} from '@/stores/useAuthStore';
import {useLocalLedgerStore} from '@/stores/useLocalLedgerStore';
import {ledgerRequest} from '@/services/localLedger';
import type {Transaction} from '@/types/transaction';
import {Spacing} from '@/constants/theme';

export function LedgerConflictReview({transaction,onResolved}:{transaction:Transaction;onResolved():void}) {
  const {colors}=useTheme(),owner=useAuthStore(s=>s.user?.id);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const row=transaction as Transaction & {remoteConflict?:Transaction;remoteConflictDeleted?:boolean};
  if(row.syncStatus!=='conflict')return null;
  const resolve=async(choice:'phone'|'website')=>{
    if(!owner || busy)return;setBusy(true);setError('');
    try {
      await ledgerRequest(owner,{op:'cloud',action:'resolveConflict',id:row.id,choice});
      if(owner===useAuthStore.getState().user?.id){await Promise.all([useLocalLedgerStore.getState().queryTransactions(),useLocalLedgerStore.getState().refreshOverview()]);onResolved();}
    }catch{setError('Could not resolve this edit. Both versions remain saved for review.');}finally{setBusy(false);}
  };
  return <View style={{gap:Spacing.sm,paddingVertical:Spacing.md}}>
    <Text accessibilityRole="header" style={{color:colors.textPrimary}}>Conflicting edits</Text>
    <Text style={{color:colors.textSecondary}}>Phone: {row.currency ?? 'INR'} {row.amount.toFixed(2)} · {row.category} · {row.transaction_date}</Text>
    {row.remoteConflict?<Text style={{color:colors.textSecondary}}>Website: {row.remoteConflict.currency ?? 'INR'} {row.remoteConflict.amount.toFixed(2)} · {row.remoteConflict.category} · {row.remoteConflict.transaction_date}</Text>:null}
    {row.remoteConflictDeleted?<Text style={{color:colors.textSecondary}}>This record was removed on the website. The phone copy is preserved until you choose to remove it.</Text>:null}
    {!row.remoteConflict && !row.remoteConflictDeleted?<Text style={{color:colors.textSecondary}}>The phone edit is preserved. Connect to download the website version before resolving it.</Text>:<>
      {!row.remoteConflictDeleted?<Button title="Keep phone edit and queue sync" variant="outline" disabled={busy} onPress={()=>void resolve('phone')}/>:null}
      <Button title={row.remoteConflictDeleted?'Remove phone copy':'Use website version'} variant="outline" disabled={busy} onPress={()=>void resolve('website')}/>
    </>}
    {error?<Text accessibilityLiveRegion="polite" style={{color:colors.textSecondary}}>{error}</Text>:null}
  </View>;
}
