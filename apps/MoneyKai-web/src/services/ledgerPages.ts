import { create } from 'zustand';
import { backendApi } from './backendApi';
import type { Transaction } from '@/types/transaction';
import type { PaginatedResponse } from '@/types/pagination';

export type LedgerFilters={from_date?:string;to_date?:string;category?:string;direction?:'income'|'expense';account?:string;merchant_prefix?:string;source?:string;payment?:string};
const pages=new Map<string,PaginatedResponse<Transaction>>();
let owner='',generation=0;
export const useLedgerInvalidation=create<{revision:number}>(()=>({revision:0}));
export function resetLedgerPages(nextOwner='') {
  owner=nextOwner;generation++;pages.clear();
  useLedgerInvalidation.setState(s=>({revision:s.revision+1}));
}
export function invalidateLedgerPages() {resetLedgerPages(owner);}
export async function getLedgerPage(user:string,filters:LedgerFilters,cursor?:string) {
  if(user!==owner) resetLedgerPages(user);
  const session=generation,key=JSON.stringify([user,filters,cursor]);
  const cached=pages.get(key);
  if(cached){pages.delete(key);pages.set(key,cached);return cached;}
  const result=await backendApi.getLedgerTransactions(filters,cursor);
  if(generation!==session || owner!==user) throw new Error('Ledger session changed');
  pages.set(key,result);
  while(pages.size>10)pages.delete(pages.keys().next().value!);
  return result;
}
export const ledgerCacheSize=()=>pages.size;
