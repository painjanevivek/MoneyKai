import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Group, GroupExpense } from '../types/group';
import { recordAppNotification } from '@/services/notificationService';
import { isDemoModeEnabled } from '@/config/environment';
import { useAuthStore } from './useAuthStore';
import { deleteUserGroup, upsertUserGroup, upsertUserGroupExpense } from '@/services/firestoreData';
import { requestAutomaticBackup } from '@/services/backupService';

const syncGroupCreate = (group: Group) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void upsertUserGroup(userId, group).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync group create:', error);
  });
};

const syncGroupUpdate = (groupId: string, payload: Partial<Group>) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  const currentGroup = useGroupStore.getState().groups.find((group) => group.id === groupId);
  if (!currentGroup) return;
  void upsertUserGroup(userId, { ...currentGroup, ...payload }).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync group update:', error);
  });
};

const syncGroupDelete = (groupId: string) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void deleteUserGroup(userId, groupId).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync group delete:', error);
  });
};

const syncGroupExpenseCreate = (expense: GroupExpense) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void upsertUserGroupExpense(userId, expense.group_id, expense).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync group expense create:', error);
  });
};

const syncGroupExpenseUpdate = (expense: GroupExpense) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void upsertUserGroupExpense(userId, expense.group_id, expense).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync group expense update:', error);
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

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      expenses: [],

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
        void requestAutomaticBackup('group added');
      },

      addGroupExpense: (expense) => {
        const newExpense: GroupExpense = {
          ...expense,
          id: `ge_${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        set((state) => ({ expenses: [newExpense, ...state.expenses] }));
        syncGroupExpenseCreate(newExpense);
        void requestAutomaticBackup('group expense added');
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
          void requestAutomaticBackup('group expense updated');
        }
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          expenses: state.expenses.filter((expense) => expense.group_id !== id),
        }));
        syncGroupDelete(id);
        void requestAutomaticBackup('group deleted');
      },

      archiveGroup: (id) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, archived: true } : group
          ),
        }));
        syncGroupUpdate(id, { archived: true });
        void requestAutomaticBackup('group archived');
      },

      restoreGroup: (id) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, archived: false } : group
          ),
        }));
        syncGroupUpdate(id, { archived: false });
        void requestAutomaticBackup('group restored');
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
