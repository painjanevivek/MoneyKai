import { create } from 'zustand';
import { initializeLedger, localLedger, type LedgerCursor, type LedgerQuery } from '@/services/localLedger';
import type { Transaction } from '@/types/transaction';
import type { DraftTransaction } from '@/types/capture';
/** Screen state contains bounded results only. The encrypted native ledger owns history. */
interface State {
  owner: string; ready: boolean; error?: string; transactions: Transaction[]; drafts: DraftTransaction[];
  transactionCursor: LedgerCursor | null; draftCursor: LedgerCursor | null;
  initialize(owner: string): Promise<void>;
  queryTransactions(query?: LedgerQuery): Promise<void>;
  queryDrafts(query?: LedgerQuery): Promise<void>;
  saveTransaction(row: Transaction): Promise<void>;
  saveDraft(row: DraftTransaction): Promise<void>;
}
let generation = 0;
export const useLocalLedgerStore = create<State>((set,get) => ({
  owner: '', ready: false, transactions: [], drafts: [], transactionCursor: null, draftCursor: null,
  async initialize(owner) {
    const session = ++generation;
    set({ owner, ready: false, error: undefined, transactions: [], drafts: [], transactionCursor: null, draftCursor: null });
    try {
      await initializeLedger(owner);
      if(session !== generation || !owner) return;
      set({ ready: true });
      await Promise.all([get().queryTransactions(),get().queryDrafts({ review: 'pending' })]);
    } catch(error) { if(session === generation) set({ error: error instanceof Error ? error.message : 'Encrypted ledger unavailable' }); }
  },
  async queryTransactions(query = {}) {
    const owner = get().owner, session = generation;
    const page = await localLedger.transactions(owner, query);
    if(session === generation && owner === get().owner) set({ transactions: page.items, transactionCursor: page.nextCursor });
  },
  async queryDrafts(query = {}) {
    const owner = get().owner, session = generation;
    const page = await localLedger.drafts(owner, query);
    if(session === generation && owner === get().owner) set({ drafts: page.items, draftCursor: page.nextCursor });
  },
  async saveTransaction(row) { await localLedger.putTransaction(get().owner,row); await get().queryTransactions(); },
  async saveDraft(row) { await localLedger.putDraft(get().owner,row); await get().queryDrafts({ review: 'pending' }); },
}));
