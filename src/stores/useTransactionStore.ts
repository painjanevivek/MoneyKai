import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Transaction, TransactionFilter, CategoryTotal } from '../types/transaction';

// ─── Sample Data ─────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];
const threeDaysAgo = new Date(Date.now() - 259200000).toISOString().split('T')[0];
const fiveDaysAgo = new Date(Date.now() - 432000000).toISOString().split('T')[0];

const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: '1', user_id: 'demo', type: 'expense', amount: 350, category: 'food', description: 'Zomato', payment_method: 'upi', transaction_date: today, created_at: today },
  { id: '2', user_id: 'demo', type: 'expense', amount: 120, category: 'transport', description: 'Metro Card Recharge', payment_method: 'upi', transaction_date: today, created_at: today },
  { id: '3', user_id: 'demo', type: 'expense', amount: 1250, category: 'shopping', description: 'Amazon', payment_method: 'card', transaction_date: yesterday, created_at: yesterday },
  { id: '4', user_id: 'demo', type: 'expense', amount: 480, category: 'entertainment', description: 'BookMyShow', payment_method: 'upi', transaction_date: twoDaysAgo, created_at: twoDaysAgo },
  { id: '5', user_id: 'demo', type: 'income', amount: 15000, category: 'allowance', description: 'Salary / Allowance', payment_method: 'bank', transaction_date: fiveDaysAgo, created_at: fiveDaysAgo },
  { id: '6', user_id: 'demo', type: 'expense', amount: 2500, category: 'rent', description: 'Room Rent Share', payment_method: 'bank', transaction_date: fiveDaysAgo, created_at: fiveDaysAgo },
  { id: '7', user_id: 'demo', type: 'expense', amount: 650, category: 'food', description: 'Swiggy Groceries', payment_method: 'upi', transaction_date: threeDaysAgo, created_at: threeDaysAgo },
  { id: '8', user_id: 'demo', type: 'expense', amount: 200, category: 'transport', description: 'Uber', payment_method: 'upi', transaction_date: threeDaysAgo, created_at: threeDaysAgo },
  { id: '9', user_id: 'demo', type: 'expense', amount: 450, category: 'bills', description: 'Mobile Recharge', payment_method: 'upi', transaction_date: twoDaysAgo, created_at: twoDaysAgo },
  { id: '10', user_id: 'demo', type: 'expense', amount: 180, category: 'food', description: 'Cafe Coffee Day', payment_method: 'cash', transaction_date: yesterday, created_at: yesterday },
  { id: '11', user_id: 'demo', type: 'expense', amount: 800, category: 'education', description: 'Udemy Course', payment_method: 'card', transaction_date: threeDaysAgo, created_at: threeDaysAgo },
  { id: '12', user_id: 'demo', type: 'expense', amount: 320, category: 'healthcare', description: 'Pharmacy', payment_method: 'cash', transaction_date: yesterday, created_at: yesterday },
  { id: '13', user_id: 'demo', type: 'expense', amount: 900, category: 'food', description: 'Dominos Pizza', payment_method: 'upi', transaction_date: today, created_at: today },
  { id: '14', user_id: 'demo', type: 'expense', amount: 1050, category: 'shopping', description: 'Myntra', payment_method: 'card', transaction_date: twoDaysAgo, created_at: twoDaysAgo },
];

interface TransactionState {
  transactions: Transaction[];
  filter: TransactionFilter;
  isLoading: boolean;

  // Computed
  getFilteredTransactions: () => Transaction[];
  getTotalSpent: () => number;
  getTotalIncome: () => number;
  getCategoryTotals: () => CategoryTotal[];
  getRecentTransactions: (count?: number) => Transaction[];

  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setFilter: (filter: Partial<TransactionFilter>) => void;
  resetFilter: () => void;
}

const DEFAULT_FILTER: TransactionFilter = {
  dateRange: 'monthly',
  searchQuery: '',
};

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => {
      let cachedFiltered: Transaction[] = [];
      let lastTxnsForFiltered: Transaction[] = [];
      let lastFilterForFiltered: any = null;

      let cachedCategoryTotals: CategoryTotal[] = [];
      let lastTxnsForCategory: Transaction[] = [];

      let cachedRecent: Transaction[] = [];
      let lastTxnsForRecent: Transaction[] = [];
      let lastCountForRecent: number = 0;

      return {
        transactions: SAMPLE_TRANSACTIONS,
        filter: DEFAULT_FILTER,
        isLoading: false,

        getFilteredTransactions: () => {
          const { transactions, filter } = get();
          if (transactions === lastTxnsForFiltered && filter === lastFilterForFiltered) {
            return cachedFiltered;
          }

          let filtered = [...transactions];
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

          const result = filtered.sort((a, b) =>
            new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
          );
          
          lastTxnsForFiltered = transactions;
          lastFilterForFiltered = filter;
          cachedFiltered = result;
          return result;
        },

        getTotalSpent: () => {
          return get().transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        },

        getTotalIncome: () => {
          return get().transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        },

        getCategoryTotals: () => {
          const txns = get().transactions;
          if (txns === lastTxnsForCategory) return cachedCategoryTotals;

          const expenses = txns.filter(t => t.type === 'expense');
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
          cachedCategoryTotals = result;
          return result;
        },

        getRecentTransactions: (count = 5) => {
          const txns = get().transactions;
          if (txns === lastTxnsForRecent && count === lastCountForRecent) {
            return cachedRecent;
          }
          const result = [...txns]
            .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
            .slice(0, count);
            
          lastTxnsForRecent = txns;
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
          set((state) => ({ transactions: [newTransaction, ...state.transactions] }));
        },

        updateTransaction: (id, updates) => {
          set((state) => ({
            transactions: state.transactions.map(t =>
              t.id === id ? { ...t, ...updates } : t
            ),
          }));
        },

        deleteTransaction: (id) => {
          set((state) => ({
            transactions: state.transactions.filter(t => t.id !== id),
          }));
        },

        setFilter: (filter) => {
          set((state) => ({ filter: { ...state.filter, ...filter } }));
        },

        resetFilter: () => set({ filter: DEFAULT_FILTER }),
      };
    },
    {
      name: 'smartpaisa-transactions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ transactions: state.transactions }),
    }
  )
);
