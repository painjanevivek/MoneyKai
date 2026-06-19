import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PortfolioAccount, PortfolioHolding, PortfolioStateResponse, PortfolioTransaction, WealthSnapshot } from '@/types/portfolio';
import type { WealthOverview } from '@/types/wealth';
import { buildWealthOverview } from '@/utils/wealthAnalytics';

const PLACEHOLDER_ACCOUNT_IDS = new Set(['local-zerodha-sandbox', 'local-account-aggregator-readiness']);
const PLACEHOLDER_HOLDING_SOURCES = new Set(['zerodha_local_sandbox']);
const PLACEHOLDER_TRANSACTION_SOURCES = new Set(['local-zerodha-sandbox-reliance', 'local-zerodha-sandbox-tcs', 'local-zerodha-sandbox-niftybees']);

const isPlaceholderAccount = (account: PortfolioAccount): boolean => PLACEHOLDER_ACCOUNT_IDS.has(account.id);

const isPlaceholderHolding = (holding: PortfolioHolding): boolean =>
  PLACEHOLDER_ACCOUNT_IDS.has(holding.accountId) || PLACEHOLDER_HOLDING_SOURCES.has(holding.source);

const isPlaceholderTransaction = (transaction: PortfolioTransaction): boolean =>
  PLACEHOLDER_ACCOUNT_IDS.has(transaction.accountId) ||
  Boolean(transaction.providerReference && PLACEHOLDER_TRANSACTION_SOURCES.has(transaction.providerReference));

const removeProviderPlaceholders = <T extends PortfolioStateResponse>(payload: T): T => ({
  ...payload,
  accounts: payload.accounts.filter((account) => !isPlaceholderAccount(account)),
  holdings: payload.holdings.filter((holding) => !isPlaceholderHolding(holding)),
  transactions: payload.transactions.filter((transaction) => !isPlaceholderTransaction(transaction)),
});

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

      setPortfolioState: (payload) => {
        const cleanedPayload = removeProviderPlaceholders(payload);
        set({
          accounts: cleanedPayload.accounts,
          holdings: cleanedPayload.holdings,
          transactions: cleanedPayload.transactions,
          snapshot: cleanedPayload.snapshot,
          lastUpdatedAt: cleanedPayload.snapshot.date,
        });
      },

      setAccounts: (accounts) => set({ accounts: accounts.filter((account) => !isPlaceholderAccount(account)), lastUpdatedAt: new Date().toISOString() }),

      upsertAccount: (account) =>
        set((state) =>
          isPlaceholderAccount(account)
            ? {
                accounts: state.accounts.filter((existing) => existing.id !== account.id),
                holdings: state.holdings.filter((holding) => holding.accountId !== account.id),
                transactions: state.transactions.filter((transaction) => transaction.accountId !== account.id),
                lastUpdatedAt: new Date().toISOString(),
              }
            : {
                accounts: [account, ...state.accounts.filter((existing) => existing.id !== account.id && !isPlaceholderAccount(existing))],
                lastUpdatedAt: new Date().toISOString(),
              }
        ),

      setHoldings: (holdings) => set({ holdings: holdings.filter((holding) => !isPlaceholderHolding(holding)), lastUpdatedAt: new Date().toISOString() }),

      upsertHolding: (holding) =>
        set((state) =>
          isPlaceholderHolding(holding)
            ? {
                holdings: state.holdings.filter((existing) => existing.id !== holding.id),
                lastUpdatedAt: new Date().toISOString(),
              }
            : {
                holdings: [holding, ...state.holdings.filter((existing) => existing.id !== holding.id && !isPlaceholderHolding(existing))],
                lastUpdatedAt: new Date().toISOString(),
              }
        ),

      removeHolding: (holdingId) =>
        set((state) => ({
          holdings: state.holdings.filter((holding) => holding.id !== holdingId),
          lastUpdatedAt: new Date().toISOString(),
        })),

      setTransactions: (transactions) => set({ transactions: transactions.filter((transaction) => !isPlaceholderTransaction(transaction)), lastUpdatedAt: new Date().toISOString() }),

      setSnapshot: (snapshot) => set({ snapshot, lastUpdatedAt: snapshot.date }),

      getWealthOverview: (userId) => {
        const state = get();
        return buildWealthOverview(
          userId,
          state.accounts.filter((account) => !isPlaceholderAccount(account)),
          state.holdings.filter((holding) => !isPlaceholderHolding(holding))
        );
      },
    }),
    {
      name: 'moneykai-portfolio',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accounts: state.accounts.filter((account) => !isPlaceholderAccount(account)),
        holdings: state.holdings.filter((holding) => !isPlaceholderHolding(holding)),
        transactions: state.transactions.filter((transaction) => !isPlaceholderTransaction(transaction)),
        snapshot: state.snapshot,
        lastUpdatedAt: state.lastUpdatedAt,
      }),
    }
  )
);
