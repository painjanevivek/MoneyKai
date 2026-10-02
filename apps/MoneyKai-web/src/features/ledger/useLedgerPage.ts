import { useEffect,useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { getLedgerPage,useLedgerInvalidation,type LedgerFilters } from '@/services/ledgerPages';
import type { Transaction } from '@/types/transaction';

export function useLedgerPage(filters:LedgerFilters={}) {
  const owner=useAuthStore(s=>s.user?.id),revision=useLedgerInvalidation(s=>s.revision);
  const key=JSON.stringify(filters);
  const [cursor,setCursor]=useState<string>(),[previous,setPrevious]=useState<(string|undefined)[]>([]);
  const [next,setNext]=useState<string|null>(null),[items,setItems]=useState<Transaction[]>([]);
  const [loading,setLoading]=useState(false),[error,setError]=useState<string>();
  useEffect(()=>{setCursor(undefined);setPrevious([]);setItems([]);setNext(null);},[owner,key,revision]);
  useEffect(()=>{
    if(!owner)return;let current=true;setLoading(true);setError(undefined);
    const timer=setTimeout(()=>void getLedgerPage(owner,JSON.parse(key),cursor).then(page=>{
      if(!current || owner!==useAuthStore.getState().user?.id)return;
      setItems(page.items);setNext(page.page.nextCursor);useTransactionStore.setState({transactions:page.items});
    }).catch(e=>{if(current)setError(e instanceof Error?e.message:'Records unavailable');})
      .finally(()=>{if(current)setLoading(false);}),150);
    return ()=>{current=false;clearTimeout(timer);};
  },[owner,key,cursor,revision]);
  return {items:items.filter(row=>row.user_id===owner),loading,error,previous:previous.length>0,next:!!next,
    first:()=>{setPrevious([]);setCursor(undefined);},
    back:()=>{setCursor(previous.at(-1));setPrevious(p=>p.slice(0,-1));},
    forward:()=>{if(next){setPrevious(p=>[...p,cursor].slice(-10));setCursor(next);}}};
}
