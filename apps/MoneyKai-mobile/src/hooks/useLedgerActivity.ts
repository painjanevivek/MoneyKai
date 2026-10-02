import { useEffect, useState } from 'react';
import { useLocalLedgerStore } from '@/stores/useLocalLedgerStore';
import type { LedgerCursor, LedgerQuery } from '@/services/localLedger';

/** Only cursors are retained between pages; financial results remain bounded to 50. */
export function useLedgerActivity(enabled:boolean,query:LedgerQuery) {
  const ready=useLocalLedgerStore(s=>s.ready),owner=useLocalLedgerStore(s=>s.owner);
  const next=useLocalLedgerStore(s=>s.transactionCursor);
  const [cursor,setCursor]=useState<LedgerCursor>();
  const [previous,setPrevious]=useState<(LedgerCursor|undefined)[]>([]);
  const [busy,setBusy]=useState(false),[error,setError]=useState<string>();
  const key=JSON.stringify(query);
  useEffect(()=>{setCursor(undefined);setPrevious([]);setError(undefined);},[key,owner]);
  useEffect(()=>{
    if(!enabled || !ready) return;
    let current=true;setBusy(true);setError(undefined);
    const timer=setTimeout(()=>void useLocalLedgerStore.getState().queryTransactions({...JSON.parse(key),limit:50,cursor})
      .catch(()=>{if(current)setError('Records could not load. Try First again.');})
      .finally(()=>{if(current)setBusy(false);}),150);
    return ()=>{current=false;clearTimeout(timer);};
  },[enabled,ready,owner,key,cursor]);
  return {busy,error,previous:previous.length>0,next:!!next,
    onFirst:()=>{setPrevious([]);setCursor(undefined);void useLocalLedgerStore.getState().queryTransactions({...query,limit:50}).catch(()=>setError('Records could not load.'));},
    onPrevious:()=>{setCursor(previous.at(-1));setPrevious(p=>p.slice(0,-1));},
    onNext:()=>{if(next){setPrevious(p=>[...p,cursor].slice(-10));setCursor(next);}}};
}
