import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { endOfDay, endOfMonth, endOfWeek, isWithinInterval, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import type { Transaction, TransactionFilter, CategoryTotal } from '../types/transaction';
import { recordAppNotification } from '@/services/notificationService';
import { useBudgetStore } from './useBudgetStore';
import { useAuthStore } from './useAuthStore';
import { deleteUserDoc, upsertUserDoc } from '@/services/firestoreData';
import { requestAutomaticBackup } from '@/services/backupService';

interface TransactionState {
  transactions: Transaction[];
  filter: TransactionFilter;
  isLoading: boolean;
  isSeeded: boolean;

  // Computed
  getFilteredTransactions: () => Transaction[];
  getTotalSpent: () => number;
  getTotalIncome: () => number;
  getCategoryTotals: () => CategoryTotal[];
  getRecentTransactions: (count?: number) => Transaction[];

  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void;
  upsertImportedTransactions: (transactions: Transaction[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  removeImportedTransactionsForAccounts: (accountIds: string[]) => void;
  setFilter: (filter: Partial<TransactionFilter>) => void;
  resetFilter: () => void;
  /** Removes seeded sample rows and resets the isSeeded flag. Call on sign-out. */
  clearSeedData: () => void;
}

const DEFAULT_FILTER: TransactionFilter = {
  dateRange: 'monthly',
  searchQuery: '',
};

const parseTransactionDate = (value: string) => new Date(`${value}T12:00:00`);

const getFilterDateInterval = (filter: TransactionFilter) => {
  const now = new Date();

  switch (filter.dateRange) {
    case 'daily':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'weekly':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'custom': {
      const start = filter.startDate ? parseTransactionDate(filter.startDate) : startOfMonth(now);
      const end = filter.endDate ? parseTransactionDate(filter.endDate) : endOfMonth(now);

      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
        return { start: startOfMonth(now), end: endOfMonth(now) };
      }

      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case 'monthly':
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
};

const applyDateFilter = (transactions: Transaction[], filter: TransactionFilter) => {
  const interval = getFilterDateInterval(filter);
  return transactions.filter((transaction) =>
    isWithinInterval(parseTransactionDate(transaction.transaction_date), interval)
  );
};

const syncTransactionCreate = (transaction: Transaction) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void upsertUserDoc('transactions', userId, transaction).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to sync transaction create:', error);
    }
  });
};

const syncTransactionUpdate = (id: string, updates: Partial<Transaction>) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void upsertUserDoc('transactions', userId, { id, ...updates } as Transaction).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to sync transaction update:', error);
    }
  });
};

const syncTransactionDelete = (id: string) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void deleteUserDoc('transactions', userId, id).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to sync transaction delete:', error);
    }
  });
};

const normalizeDuplicateText = (value?: string) =>
  value?.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() ?? '';

const isDuplicateCapturedTransaction = (
  existing: Transaction,
  incoming: Transaction
) => {
  if (existing.id === incoming.id) return true;
  if (existing.canonicalTransactionKey && existing.canonicalTransactionKey === incoming.canonicalTransactionKey) return true;
  if (existing.sourceFingerprint && existing.sourceFingerprint === incoming.sourceFingerprint) return true;

  const hasCaptureAccount = Boolean(incoming.captureAccountId || incoming.captureBankLabel || incoming.captureAccountHint);
  if (!hasCaptureAccount) return false;

  const sameAccount =
    existing.captureAccountId === incoming.captureAccountId ||
    Boolean(existing.captureAccountHint && incoming.captureAccountHint && existing.captureAccountHint === incoming.captureAccountHint);

  return (
    sameAccount &&
    existing.type === incoming.type &&
    existing.transaction_date === incoming.transaction_date &&
    Math.abs(existing.amount - incoming.amount) < 0.01 &&
    normalizeDuplicateText(existing.description) === normalizeDuplicateText(incoming.description)
  );
};

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => {
      let cachedFiltered: Transaction[] = [];
      let lastTxnsForFiltered: Transaction[] = [];
      let lastFilterForFiltered: any = null;

      let cachedCategoryTotals: CategoryTotal[] = [];
      let lastTxnsForCategory: Transaction[] = [];
      let lastFilterForCategory: any = null;

      let cachedRecent: Transaction[] = [];
      let lastTxnsForRecent: Transaction[] = [];
      let lastFilterForRecent: any = null;
      let lastCountForRecent: number = 0;

      return {
        // Only seed sample data on first launch (isSeeded persists across restarts).
        transactions: [],
        filter: DEFAULT_FILTER,
        isLoading: false,
        isSeeded: false,

        getFilteredTransactions: () => {
          const { transactions, filter } = get();
          if (transactions === lastTxnsForFiltered && filter === lastFilterForFiltered) {
            return cachedFiltered;
          }

          let filtered = applyDateFilter(transactions, filter);
          if (filter.type) {
            filtered = filtered.filter(t => t.type === filter.type);
          }
          if (filter.category) {
            filtered = filtered.filter(t => t.category === filter.category);
          }
          if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
              t.description.toLowerCase().includes(query) ||
              t.category.toLowerCase().includes(query)
            );
          }
          if (filter.paymentMethod) {
            filtered = filtered.filter(t => t.payment_method === filter.paymentMethod);
          }
          if (filter.captureAccountId) {
            filtered = filtered.filter(t => t.captureAccountId === filter.captureAccountId);
          }

          const result = filtered.sort((a, b) =>
            new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
          );
          
          lastTxnsForFiltered = transactions;
          lastFilterForFiltered = filter;
          cachedFiltered = result;
          return result;
        },

        getTotalSpent: () => {
          const { transactions, filter } = get();
          return applyDateFilter(transactions, filter)
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        },

        getTotalIncome: () => {
          const { transactions, filter } = get();
          return applyDateFilter(transactions, filter)
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        },

        getCategoryTotals: () => {
          const { transactions: txns, filter } = get();
          if (txns === lastTxnsForCategory && filter === lastFilterForCategory) return cachedCategoryTotals;

          const expenses = applyDateFilter(txns, filter).filter(t => t.type === 'expense');
          const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
          const categoryMap = new Map<string, { total: number; count: number }>();

          expenses.forEach(t => {
            const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
            categoryMap.set(t.category, {
              total: existing.total + t.amount,
              count: existing.count + 1,
            });
          });

          const totals: CategoryTotal[] = [];
          categoryMap.forEach((value, category) => {
            totals.push({
              category,
              total: value.total,
              percentage: totalSpent > 0 ? (value.total / totalSpent) * 100 : 0,
              count: value.count,
            });
          });

          const result = totals.sort((a, b) => b.total - a.total);
          lastTxnsForCategory = txns;
          lastFilterForCategory = filter;
          cachedCategoryTotals = result;
          return result;
        },

        getRecentTransactions: (count = 5) => {
          const { transactions: txns, filter } = get();
          if (txns === lastTxnsForRecent && filter === lastFilterForRecent && count === lastCountForRecent) {
            return cachedRecent;
          }
          const result = applyDateFilter(txns, filter)
            .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
            .slice(0, count);
            
          lastTxnsForRecent = txns;
          lastFilterForRecent = filter;
          lastCountForRecent = count;
          cachedRecent = result;
          return result;
        },

        addTransaction: (transaction) => {
          const newTransaction: Transaction = {
            ...transaction,
            id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
          };
          const nextTransactions = [newTransaction, ...get().transactions];
          set({ transactions: nextTransactions });
          syncTransactionCreate(newTransaction);
          void requestAutomaticBackup('transaction added');

          if (newTransaction.type === 'expense') {
            const allowance = useBudgetStore.getState().settings.monthly_allowance;
            const transactionDate = parseTransactionDate(newTransaction.transaction_date);
            const transactionMonth = { start: startOfMonth(transactionDate), end: endOfMonth(transactionDate) };
            const spent = nextTransactions
              .filter((item) => item.type === 'expense')
              .filter((item) => isWithinInterval(parseTransactionDate(item.transaction_date), transactionMonth))
              .reduce((sum, item) => sum + item.amount, 0);
            const spendRate = allowance > 0 ? (spent / allowance) * 100 : 0;

            if (spendRate >= 100) {
              void recordAppNotification({
                title: 'Budget exhausted',
                body: 'You have used your full monthly budget.',
                type: 'budget',
                actionRoute: '/savings',
              });
            } else if (spendRate >= 80) {
              void recordAppNotification({
                title: 'Spending alert',
                body: `You have used ${Math.round(spendRate)}% of your monthly budget.`,
                type: 'budget',
                actionRoute: '/savings',
              });
            }
          }
        },

        upsertImportedTransactions: (incomingTransactions) => {
          if (incomingTransactions.length === 0) return;

          const transactionsToSync = incomingTransactions.map((transaction) => ({
            ...transaction,
            created_at: transaction.created_at ?? new Date().toISOString(),
          }));

          set((state) => {
            const nextTransactions = [...state.transactions];

            transactionsToSync.forEach((incoming) => {
              const existingIndex = nextTransactions.findIndex((existing) =>
                isDuplicateCapturedTransaction(existing, incoming)
              );

              if (existingIndex >= 0) {
                const existing = nextTransactions[existingIndex];
                nextTransactions[existingIndex] = {
                  ...existing,
                  ...incoming,
                  id: existing.id,
                  created_at: existing.created_at,
                };
              } else {
                nextTransactions.unshift(incoming);
              }
            });

            return {
              transactions: nextTransactions.sort(
                (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
              ),
            };
          });

          transactionsToSync.forEach(syncTransactionCreate);
          void requestAutomaticBackup('linked account transactions imported');
        },

        updateTransaction: (id, updates) => {
          set((state) => ({
            transactions: state.transactions.map(t =>
              t.id === id ? { ...t, ...updates } : t
            ),
          }));
          syncTransactionUpdate(id, updates);
          void requestAutomaticBackup('transaction updated');
        },

        deleteTransaction: (id) => {
          set((state) => ({
            transactions: state.transactions.filter(t => t.id !== id),
          }));
          syncTransactionDelete(id);
          void requestAutomaticBackup('transaction deleted');
        },

        removeImportedTransactionsForAccounts: (accountIds) => {
          if (accountIds.length === 0) return;

          const accountIdSet = new Set(accountIds);
          let removedTransactions: Transaction[] = [];
          set((state) => {
            removedTransactions = state.transactions.filter((transaction) =>
              transaction.captureAccountId ? accountIdSet.has(transaction.captureAccountId) : false
            );
            return {
              transactions: state.transactions.filter((transaction) =>
                transaction.captureAccountId ? !accountIdSet.has(transaction.captureAccountId) : true
              ),
            };
          });

          removedTransactions.forEach((transaction) => syncTransactionDelete(transaction.id));
          void requestAutomaticBackup('linked account imported transactions removed');
        },

        setFilter: (filter) => {
          set((state) => ({ filter: { ...state.filter, ...filter } }));
        },

        resetFilter: () => set({ filter: DEFAULT_FILTER }),

        clearSeedData: () =>
          set((state) => ({
            transactions: state.transactions.filter(
              (t) => t.user_id !== 'sample'
            ),
            isSeeded: false,
          })),
      };
    },
    {
      name: 'moneykai-transactions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        isSeeded: state.isSeeded,
      }),
    }
  )
);
