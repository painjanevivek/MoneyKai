import { create } from 'zustand';
import { initializeLedger, localLedger, type LedgerCursor, type LedgerQuery } from '@/services/localLedger';
import type { Transaction } from '@/types/transaction';
import type { DraftTransaction } from '@/types/capture';
/** Screen state contains bounded results only. The encrypted native ledger owns history. */
interface State {
  owner: string; ready: boolean; error?: string; transactions: Transaction[]; drafts: DraftTransaction[];
  transactionCursor: LedgerCursor | null; draftCursor: LedgerCursor | null;
  transactionQuery:LedgerQuery; draftQuery:LedgerQuery; recent:Transaction[];
  summaryItems:{month:string;category:string;direction:string;amountMinor:number;count:number}[];
  counts:{transactions:number;pending:number;reviewed:number};
  refreshOverview():Promise<void>;
  initialize(owner: string): Promise<void>;
  queryTransactions(query?: LedgerQuery): Promise<void>;
  queryDrafts(query?: LedgerQuery): Promise<void>;
  saveTransaction(row: Transaction): Promise<void>;
  saveDraft(row: DraftTransaction): Promise<void>;
}
let generation = 0;
let transactionRequest = 0;
let draftRequest = 0;
export const useLocalLedgerStore = create<State>((set,get) => ({
  owner: '', ready: false, transactions: [], drafts: [], transactionCursor: null, draftCursor: null,
  transactionQuery:{},draftQuery:{review:'pending'},recent:[],summaryItems:[],counts:{transactions:0,pending:0,reviewed:0},
  async refreshOverview() {
    const owner=get().owner,session=generation;
    const now=new Date(); const month=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const [summary,recent,counts]=await Promise.all([localLedger.summaries(owner,month),localLedger.transactions(owner,{limit:10,archived:false}),localLedger.counts(owner)]);
    if(session===generation && owner===get().owner) set({summaryItems:summary.items,recent:recent.items,counts});
  },
  async initialize(owner) {
    const session = ++generation;
    transactionRequest++; draftRequest++;
    set({ owner, ready: false, error: undefined, transactions: [], drafts: [], recent:[],summaryItems:[],counts:{transactions:0,pending:0,reviewed:0},transactionQuery:{},draftQuery:{review:'pending'},transactionCursor: null, draftCursor: null });
    try {
      await initializeLedger(owner);
      if(session !== generation || !owner) return;
      set({ ready: true });
      await Promise.all([get().queryTransactions(),get().queryDrafts({ review: 'pending' }),get().refreshOverview()]);
    } catch(error) { if(session === generation) set({ error: error instanceof Error ? error.message : 'Encrypted ledger unavailable' }); }
  },
  async queryTransactions(query = get().transactionQuery) {
    const owner = get().owner, session = generation, request = ++transactionRequest;
    const page = await localLedger.transactions(owner, query);
    if(session === generation && owner === get().owner && request === transactionRequest) {
      set({ transactions: page.items, transactionCursor: page.nextCursor,transactionQuery:query });
      const {useTransactionStore}=await import('./useTransactionStore');
      if(session===generation && owner===get().owner && request === transactionRequest) useTransactionStore.setState({transactions:page.items});
    }
  },
  async queryDrafts(query = get().draftQuery) {
    const owner = get().owner, session = generation, request = ++draftRequest;
    const page = await localLedger.drafts(owner, query);
    if(session === generation && owner === get().owner && request === draftRequest) set({ drafts: page.items, draftCursor: page.nextCursor,draftQuery:query });
  },
  async saveTransaction(row) { await localLedger.putTransaction(get().owner,row); await get().queryTransactions(); },
  async saveDraft(row) { await localLedger.putDraft(get().owner,row); await get().queryDrafts({ review: 'pending' }); },
}));
