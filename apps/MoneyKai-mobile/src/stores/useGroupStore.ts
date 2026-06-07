import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Group, GroupExpense } from '../types/group';
import { recordAppNotification } from '@/services/notificationService';
import { backendApi, isBackendConfigured } from '@/services/backendApi';
import { isDemoModeEnabled } from '@/config/environment';
import { queueSyncOperation } from '@/services/syncQueue';

const syncGroupCreate = (group: Group) => {
  if (!isBackendConfigured()) return;
  void backendApi.createGroup(group).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync group create:', error);
    void queueSyncOperation({ kind: 'group', action: 'create', payload: group });
  });
};

const syncGroupUpdate = (groupId: string, payload: Partial<Group>) => {
  if (!isBackendConfigured()) return;
  void backendApi.updateGroup(groupId, payload).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync group update:', error);
    void queueSyncOperation({ kind: 'group', action: 'update', groupId, payload });
  });
};

const syncGroupDelete = (groupId: string) => {
  if (!isBackendConfigured()) return;
  void backendApi.deleteGroup(groupId).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync group delete:', error);
    void queueSyncOperation({ kind: 'group', action: 'delete', groupId });
  });
};

const syncGroupExpenseCreate = (expense: GroupExpense) => {
  if (!isBackendConfigured()) return;
  void backendApi.createGroupExpense(expense.group_id, expense).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync group expense create:', error);
    void queueSyncOperation({ kind: 'groupExpense', action: 'create', groupId: expense.group_id, payload: expense });
  });
};

const syncGroupExpenseUpdate = (expense: GroupExpense) => {
  if (!isBackendConfigured()) return;
  void backendApi.updateGroupExpense(expense.group_id, expense.id, expense).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync group expense update:', error);
    void queueSyncOperation({
      kind: 'groupExpense',
      action: 'update',
      groupId: expense.group_id,
      expenseId: expense.id,
      payload: expense,
    });
  });
};

interface GroupState {
  groups: Group[];
  expenses: GroupExpense[];

  addGroup: (group: Omit<Group, 'id' | 'created_at'>) => void;
  addGroupExpense: (expense: Omit<GroupExpense, 'id' | 'created_at'>) => void;
  settleExpense: (splitId: string) => void;
  deleteGroup: (id: string) => void;
  archiveGroup: (id: string) => void;
  restoreGroup: (id: string) => void;
  getGroupExpenses: (groupId: string) => GroupExpense[];
}

const SAMPLE_GROUPS: Group[] = [
  {
    id: 'grp1',
    created_by: 'sample',
    name: 'Flat 302 - Roommates',
    type: 'flatmates',
    description: 'Shared flat expenses',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    archived: false,
    members: [
      { id: 'm1', group_id: 'grp1', user_id: 'sample', role: 'admin', joined_at: '', user_name: 'Aditya' },
      { id: 'm2', group_id: 'grp1', user_id: 'u2', role: 'member', joined_at: '', user_name: 'Rahul' },
      { id: 'm3', group_id: 'grp1', user_id: 'u3', role: 'member', joined_at: '', user_name: 'Priya' },
    ],
    total_expenses: 4500,
  },
  {
    id: 'grp2',
    created_by: 'sample',
    name: 'Goa Trip',
    type: 'trip',
    description: 'Goa trip expenses split',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    archived: false,
    members: [
      { id: 'm4', group_id: 'grp2', user_id: 'sample', role: 'admin', joined_at: '', user_name: 'Aditya' },
      { id: 'm5', group_id: 'grp2', user_id: 'u4', role: 'member', joined_at: '', user_name: 'Vikram' },
      { id: 'm6', group_id: 'grp2', user_id: 'u5', role: 'member', joined_at: '', user_name: 'Sneha' },
      { id: 'm7', group_id: 'grp2', user_id: 'u6', role: 'member', joined_at: '', user_name: 'Amit' },
    ],
    total_expenses: 12000,
  },
];

const SAMPLE_EXPENSES: GroupExpense[] = [
  {
    id: 'ge1',
    group_id: 'grp1',
    paid_by: 'sample',
    amount: 1500,
    description: 'Electricity Bill',
    split_type: 'equal',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    paid_by_name: 'Aditya',
    splits: [
      { id: 's1', group_expense_id: 'ge1', user_id: 'u2', amount: 500, is_settled: false, user_name: 'Rahul' },
      { id: 's2', group_expense_id: 'ge1', user_id: 'u3', amount: 500, is_settled: true, settled_at: new Date().toISOString(), user_name: 'Priya' },
    ],
  },
  {
    id: 'ge2',
    group_id: 'grp1',
    paid_by: 'u2',
    amount: 3000,
    description: 'Grocery Run',
    split_type: 'equal',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    paid_by_name: 'Rahul',
    splits: [
      { id: 's3', group_expense_id: 'ge2', user_id: 'sample', amount: 1000, is_settled: false, user_name: 'Aditya' },
      { id: 's4', group_expense_id: 'ge2', user_id: 'u3', amount: 1000, is_settled: false, user_name: 'Priya' },
    ],
  },
];

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: isDemoModeEnabled() ? SAMPLE_GROUPS : [],
      expenses: isDemoModeEnabled() ? SAMPLE_EXPENSES : [],

      addGroup: (group) => {
        const newGroup: Group = {
          ...group,
          id: `grp_${Date.now()}`,
          created_at: new Date().toISOString(),
          archived: group.archived ?? false,
        };
        set((state) => ({ groups: [newGroup, ...state.groups] }));
        syncGroupCreate(newGroup);
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
        syncGroupExpenseCreate(newExpense);
      },

      settleExpense: (splitId) => {
        let updatedExpense: GroupExpense | null = null;
        set((state) => ({
          expenses: state.expenses.map((expense) => {
            if (!expense.splits?.some((split) => split.id === splitId)) {
              return expense;
            }

            updatedExpense = {
              ...expense,
              splits: expense.splits?.map((split) =>
                split.id === splitId
                  ? { ...split, is_settled: true, settled_at: new Date().toISOString() }
                  : split
              ),
            };
            return updatedExpense;
          }),
        }));

        if (updatedExpense) {
          syncGroupExpenseUpdate(updatedExpense);
        }
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          expenses: state.expenses.filter((expense) => expense.group_id !== id),
        }));
        syncGroupDelete(id);
      },

      archiveGroup: (id) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, archived: true } : group
          ),
        }));
        syncGroupUpdate(id, { archived: true });
      },

      restoreGroup: (id) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, archived: false } : group
          ),
        }));
        syncGroupUpdate(id, { archived: false });
      },

      getGroupExpenses: (groupId) => get().expenses.filter((expense) => expense.group_id === groupId),
    }),
    {
      name: 'moneykai-groups',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!isDemoModeEnabled()) {
          state.groups = state.groups.filter((group) => group.created_by !== 'sample');
          state.expenses = state.expenses.filter((expense) => expense.group_id !== 'grp1' && expense.group_id !== 'grp2');
        }
      },
    }
  )
);
