import { NativeModules } from 'react-native';
import type { Transaction } from '@/types/transaction';
import type { DraftTransaction } from '@/types/capture';
export type LedgerCursor = { day: string; id: string };
export type LedgerPage<T> = { items: T[]; nextCursor: LedgerCursor | null };
export type LedgerQuery = { limit?: number; cursor?: LedgerCursor; account?: string; category?: string; review?: string; sync?: string; direction?: 'income' | 'expense'; from?: string; to?: string; merchantPrefix?: string; source?:string; payment?:string; archived?:boolean };
type NativeLedger = { ledgerRequest(owner: string, request: string): Promise<string> };
export async function ledgerRequest<T>(owner: string, request: Record<string, unknown>): Promise<T> {
  const native = NativeModules.MoneyKaiNativeCapture as NativeLedger | undefined;
  if (!native?.ledgerRequest) throw new Error('Encrypted ledger unavailable. No plaintext fallback was used.');
  return JSON.parse(await native.ledgerRequest(owner, JSON.stringify(request))) as T;
}
export async function initializeLedger(owner: string): Promise<void> {
  await ledgerRequest(owner, { op: 'owner' });
  if (!owner) return;
  while (!(await ledgerRequest<{ complete: boolean }>(owner, { op: 'migrate' })).complete) await new Promise<void>(resolve => setTimeout(resolve, 0));
}
export const localLedger = {
  transactions: (owner: string, query: LedgerQuery = {}) => ledgerRequest<LedgerPage<Transaction>>(owner, { op: 'page', table: 'transactions', ...query }),
  drafts: (owner: string, query: LedgerQuery = {}) => ledgerRequest<LedgerPage<DraftTransaction>>(owner, { op: 'page', table: 'drafts', ...query }),
  putTransaction: (owner: string, row: Transaction) => ledgerRequest(owner, { op: 'put', table: 'transactions', row }),
  putDraft: (owner: string, row: DraftTransaction) => ledgerRequest(owner, { op: 'put', table: 'drafts', row }),
  remove: (owner: string, table: 'transactions' | 'drafts', id: string) => ledgerRequest(owner, { op: 'delete', table, id }),
  get: <T>(owner:string,table:'transactions'|'drafts',id:string) => ledgerRequest<{row:T|null}>(owner,{op:'get',table,id}),
  approve: (owner:string,id:string,category:string) => ledgerRequest(owner,{op:'approve',id,category}),
  counts: (owner:string) => ledgerRequest<{transactions:number;pending:number;reviewed:number}>(owner,{op:'counts'}),
  summaries: (owner: string, month: string) => ledgerRequest<{ items: { month: string; category: string; direction: string; amountMinor: number; count: number }[] }>(owner, { op: 'summaries', month }),
};
