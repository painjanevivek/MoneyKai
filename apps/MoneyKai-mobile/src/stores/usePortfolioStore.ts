import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PortfolioAccount, PortfolioHolding, PortfolioTransaction } from '@/types/portfolio';
import type { WealthOverview } from '@/types/wealth';
import { buildWealthOverview } from '@/utils/wealthAnalytics';

interface PortfolioState {
  accounts: PortfolioAccount[];
  holdings: PortfolioHolding[];
  transactions: PortfolioTransaction[];
  lastUpdatedAt?: string;
  setAccounts: (accounts: PortfolioAccount[]) => void;
  upsertAccount: (account: PortfolioAccount) => void;
  setHoldings: (holdings: PortfolioHolding[]) => void;
  upsertHolding: (holding: PortfolioHolding) => void;
  removeHolding: (holdingId: string) => void;
  setTransactions: (transactions: PortfolioTransaction[]) => void;
  getWealthOverview: (userId: string) => WealthOverview;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      accounts: [],
      holdings: [],
      transactions: [],

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

      getWealthOverview: (userId) => buildWealthOverview(userId, get().accounts, get().holdings),
    }),
    {
      name: 'moneykai-portfolio',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        holdings: state.holdings,
        transactions: state.transactions,
        lastUpdatedAt: state.lastUpdatedAt,
      }),
    }
  )
);
