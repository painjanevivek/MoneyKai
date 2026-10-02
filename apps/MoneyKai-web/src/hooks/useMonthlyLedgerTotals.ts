import {useEffect,useState} from 'react';
import {useAuthStore} from '@/stores/useAuthStore';
import {backendApi,type MonthlyLedgerSummary} from '@/services/backendApi';
import {useLedgerInvalidation} from '@/services/ledgerPages';
import type {CategoryTotal} from '@/types/transaction';

export function useMonthlyLedgerTotals(month:string) {
  const owner=useAuthStore(s=>s.user?.id),revision=useLedgerInvalidation(s=>s.revision);
  const [result,setResult]=useState<{owner:string;month:string;revision:number;summary:MonthlyLedgerSummary}>(),[error,setError]=useState(false);
  useEffect(()=>{
    let active=true;setResult(undefined);setError(false);
    if(owner)void backendApi.getMonthlyLedgerSummary(month).then(value=>{
      if(active && owner===useAuthStore.getState().user?.id)setResult({owner,month,revision,summary:value});
    }).catch(()=>{if(active)setError(true);});
    return()=>{active=false;};
  },[owner,month,revision]);
  const summary=result?.owner===owner && result?.month===month && result?.revision===revision?result.summary:undefined;
  const active=summary?.status==='active';
  const sum=(direction:string)=>summary?.items.filter(r=>r.category==='' && r.direction===direction).reduce((n,r)=>n+r.amountMinor,0) ?? 0;
  const expense=sum('expense')/100,income=sum('income')/100;
  const categories:CategoryTotal[]=summary?.items.filter(r=>r.category && r.direction==='expense' && r.count>0).map(r=>({category:r.category,total:r.amountMinor/100,count:r.count,percentage:expense>0?r.amountMinor/100/expense*100:0})) ?? [];
  return {ready:active,error,expense,income,categories,count:summary?.items.filter(r=>r.category==='').reduce((n,r)=>n+r.count,0) ?? 0};
}
