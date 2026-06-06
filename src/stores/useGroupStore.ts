import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Group, GroupExpense } from '../types/group';
import { recordAppNotification } from '@/services/notificationService';
import { isFirebaseConfigured } from '@/services/firebase';

interface GroupState {
  groups: Group[];
  expenses: GroupExpense[];

  // Actions
  addGroup: (group: Omit<Group, 'id' | 'created_at'>) => void;
  addGroupExpense: (expense: Omit<GroupExpense, 'id' | 'created_at'>) => void;
  settleExpense: (splitId: string) => void;
  deleteGroup: (id: string) => void;
  getGroupExpenses: (groupId: string) => GroupExpense[];
}

const SAMPLE_GROUPS: Group[] = [
  {
    id: 'grp1',
    created_by: 'demo',
    name: 'Flat 302 - Roommates',
    type: 'flatmates',
    description: 'Shared flat expenses',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    members: [
      { id: 'm1', group_id: 'grp1', user_id: 'demo', role: 'admin', joined_at: '', user_name: 'Aditya' },
      { id: 'm2', group_id: 'grp1', user_id: 'u2', role: 'member', joined_at: '', user_name: 'Rahul' },
      { id: 'm3', group_id: 'grp1', user_id: 'u3', role: 'member', joined_at: '', user_name: 'Priya' },
    ],
    total_expenses: 4500,
  },
  {
    id: 'grp2',
    created_by: 'demo',
    name: 'Goa Trip ðŸ–ï¸',
    type: 'trip',
    description: 'Goa trip expenses split',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    members: [
      { id: 'm4', group_id: 'grp2', user_id: 'demo', role: 'admin', joined_at: '', user_name: 'Aditya' },
      { id: 'm5', group_id: 'grp2', user_id: 'u4', role: 'member', joined_at: '', user_name: 'Vikram' },
      { id: 'm6', group_id: 'grp2', user_id: 'u5', role: 'member', joined_at: '', user_name: 'Sneha' },
      { id: 'm7', group_id: 'grp2', user_id: 'u6', role: 'member', joined_at: '', user_name: 'Amit' },
    ],
    total_expenses: 12000,
  },
];

const SAMPLE_EXPENSES: GroupExpense[] = [
  {
    id: 'ge1', group_id: 'grp1', paid_by: 'demo', amount: 1500, description: 'Electricity Bill',
    split_type: 'equal', created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    paid_by_name: 'Aditya',
    splits: [
      { id: 's1', group_expense_id: 'ge1', user_id: 'u2', amount: 500, is_settled: false, user_name: 'Rahul' },
      { id: 's2', group_expense_id: 'ge1', user_id: 'u3', amount: 500, is_settled: true, settled_at: new Date().toISOString(), user_name: 'Priya' },
    ],
  },
  {
    id: 'ge2', group_id: 'grp1', paid_by: 'u2', amount: 3000, description: 'Grocery Run',
    split_type: 'equal', created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    paid_by_name: 'Rahul',
    splits: [
      { id: 's3', group_expense_id: 'ge2', user_id: 'demo', amount: 1000, is_settled: false, user_name: 'Aditya' },
      { id: 's4', group_expense_id: 'ge2', user_id: 'u3', amount: 1000, is_settled: false, user_name: 'Priya' },
    ],
  },
];

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: isFirebaseConfigured() ? [] : SAMPLE_GROUPS,
      expenses: isFirebaseConfigured() ? [] : SAMPLE_EXPENSES,

      addGroup: (group) => {
        const newGroup: Group = {
          ...group,
          id: `grp_${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ groups: [newGroup, ...state.groups] }));
        void recordAppNotification({
          title: 'Group created',
          body: newGroup.name,
          type: 'system',
          actionRoute: '/(tabs)/groups',
        });
      },

      addGroupExpense: (expense) => {
        const newExpense: GroupExpense = {
          ...expense,
          id: `ge_${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ expenses: [newExpense, ...state.expenses] }));
      },

      settleExpense: (splitId) => set((state) => ({
        expenses: state.expenses.map(e => ({
          ...e,
          splits: e.splits?.map(s =>
            s.id === splitId ? { ...s, is_settled: true, settled_at: new Date().toISOString() } : s
          ),
        })),
      })),

      deleteGroup: (id) => set((state) => ({
        groups: state.groups.filter(g => g.id !== id),
        expenses: state.expenses.filter(e => e.group_id !== id),
      })),

      getGroupExpenses: (groupId) => get().expenses.filter(e => e.group_id === groupId),
    }),
    {
      name: 'moneykai-groups',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (isFirebaseConfigured()) {
          state.groups = state.groups.filter((group) => group.created_by !== 'demo');
          state.expenses = state.expenses.filter((expense) => expense.group_id !== 'grp1' && expense.group_id !== 'grp2');
        }
      },
    }
  )
);

