import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PortfolioAccount, PortfolioHolding, PortfolioStateResponse, PortfolioTransaction, WealthSnapshot } from '@/types/portfolio';
import type { WealthOverview } from '@/types/wealth';
import { buildWealthOverview } from '@/utils/wealthAnalytics';

interface PortfolioState {
  accounts: PortfolioAccount[];
  holdings: PortfolioHolding[];
  transactions: PortfolioTransaction[];
  snapshot?: WealthSnapshot;
  lastUpdatedAt?: string;
  setPortfolioState: (payload: PortfolioStateResponse) => void;
  setAccounts: (accounts: PortfolioAccount[]) => void;
  upsertAccount: (account: PortfolioAccount) => void;
  setHoldings: (holdings: PortfolioHolding[]) => void;
  upsertHolding: (holding: PortfolioHolding) => void;
  removeHolding: (holdingId: string) => void;
  setTransactions: (transactions: PortfolioTransaction[]) => void;
  setSnapshot: (snapshot: WealthSnapshot) => void;
  getWealthOverview: (userId: string) => WealthOverview;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      accounts: [],
      holdings: [],
      transactions: [],

      setPortfolioState: (payload) =>
        set({
          accounts: payload.accounts,
          holdings: payload.holdings,
          transactions: payload.transactions,
          snapshot: payload.snapshot,
          lastUpdatedAt: payload.snapshot.date,
        }),

      setAccounts: (accounts) => set({ accounts, lastUpdatedAt: new Date().toISOString() }),

      upsertAccount: (account) =>
        set((state) => ({
          accounts: [account, ...state.accounts.filter((existing) => existing.id !== account.id)],
          lastUpdatedAt: new Date().toISOString(),
        })),

      setHoldings: (holdings) => set({ holdings, lastUpdatedAt: new Date().toISOString() }),

      upsertHolding: (holding) =>
        set((state) => ({
          holdings: [holding, ...state.holdings.filter((existing) => existing.id !== holding.id)],
          lastUpdatedAt: new Date().toISOString(),
        })),

      removeHolding: (holdingId) =>
        set((state) => ({
          holdings: state.holdings.filter((holding) => holding.id !== holdingId),
          lastUpdatedAt: new Date().toISOString(),
        })),

      setTransactions: (transactions) => set({ transactions, lastUpdatedAt: new Date().toISOString() }),

      setSnapshot: (snapshot) => set({ snapshot, lastUpdatedAt: snapshot.date }),

      getWealthOverview: (userId) => buildWealthOverview(userId, get().accounts, get().holdings),
    }),
    {
      name: 'moneykai-portfolio',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        holdings: state.holdings,
        transactions: state.transactions,
        snapshot: state.snapshot,
        lastUpdatedAt: state.lastUpdatedAt,
      }),
    }
  )
);
