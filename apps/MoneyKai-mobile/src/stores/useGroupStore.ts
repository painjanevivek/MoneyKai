import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Group, GroupExpense, Settlement } from '../types/group';
import { recordAppNotification } from '@/services/notificationService';
import { isDemoModeEnabled } from '@/config/environment';
import { useAuthStore } from './useAuthStore';
import { backendApi } from '@/services/backendApi';
import { requestAutomaticBackup } from '@/services/backupService';
import {
  appendExpenseIdempotently,
  createClientMutationId,
  recordSettlementEvent,
  reverseSettlementEvent,
} from '@/utils/groupExpense';

const groupPayload = (group: Group) => {
  const { sync_status: _syncStatus, sync_error: _syncError, pending_action: _pendingAction, ...payload } = group;
  return payload;
};

const expensePayload = (expense: GroupExpense) => {
  const { sync_status: _syncStatus, sync_error: _syncError, ...payload } = expense;
  return {
    ...payload,
    settlements: payload.settlements?.map(({ sync_status: _settlementStatus, sync_error: _settlementError, ...settlement }) => settlement),
  };
};

// A transport timeout or server error does not prove that a financial command failed.
const isUnknownMutationOutcome = (error: unknown): boolean => {
  const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 0;
  const message = error instanceof Error ? error.message : '';
  return !Number.isFinite(status) || status === 0 || status >= 500 || (status === 409 && /original mutation is still pending/i.test(message));
};

const reconcileConfirmedExpense = (confirmed: GroupExpense, local: GroupExpense): GroupExpense => {
  const remoteMutations = new Set((confirmed.settlements ?? []).map((event) => event.mutation_id));
  const unconfirmedLocal = (local.settlements ?? []).filter((event) => event.sync_status !== 'confirmed' && !remoteMutations.has(event.mutation_id));
  return {
    ...confirmed,
    sync_status: 'confirmed',
    settlements: [...(confirmed.settlements ?? []).map((event) => ({ ...event, sync_status: 'confirmed' as const })), ...unconfirmedLocal],
  };
};

const syncGroupCreate = async (group: Group) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId || isDemoModeEnabled()) return;
  await backendApi.createGroup(groupPayload(group), group.mutation_id);
};

const syncGroupDelete = (groupId: string) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void backendApi.deleteGroup(groupId).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync group delete:', error);
  });
};

const syncGroupExpenseCreate = async (expense: GroupExpense) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId || isDemoModeEnabled()) return;
  await backendApi.createGroupExpense(expense.group_id, expensePayload(expense), expense.mutation_id);
};

const groupSyncFlights = new Map<string, Promise<void>>();
const expenseSyncFlights = new Map<string, Promise<void>>();
const settlementFlights = new Map<string, ReturnType<typeof backendApi.recordGroupSettlement>>();
const reversalFlights = new Map<string, ReturnType<typeof backendApi.reverseGroupSettlement>>();

const syncGroupCreateOnce = (group: Group): Promise<void> => {
  const existing = groupSyncFlights.get(group.id);
  if (existing) return existing;
  const run = async () => {
    if (group.pending_action === 'archive' && !isDemoModeEnabled()) await backendApi.archiveGroup(group.id);
    else if (group.pending_action === 'restore' && !isDemoModeEnabled()) await backendApi.restoreGroup(group.id);
    else if (group.pending_action === 'members' && !isDemoModeEnabled()) {
      if (useAuthStore.getState().user?.id !== group.created_by) throw new Error('Sign in to the group owner account before retrying this update.');
      const response = await backendApi.updateGroup(group.id, { members: group.members });
      const returnedIds = new Set(response.item.members?.map(member => member.user_id));
      if (group.members?.some(member => !returnedIds.has(member.user_id))) throw new Error('The server has not confirmed the added people. Retry this group update.');
    }
    else await syncGroupCreate(group);
  };
  const flight = run().finally(() => groupSyncFlights.delete(group.id));
  groupSyncFlights.set(group.id, flight);
  return flight;
};

const syncGroupExpenseCreateOnce = (expense: GroupExpense): Promise<void> => {
  const existing = expenseSyncFlights.get(expense.id);
  if (existing) return existing;
  const flight = syncGroupExpenseCreate(expense).finally(() => expenseSyncFlights.delete(expense.id));
  expenseSyncFlights.set(expense.id, flight);
  return flight;
};

const recordSettlementOnce = (groupId: string, expenseId: string, splitId: string, amountPaise: number, mutationId: string) => {
  const existing = settlementFlights.get(mutationId);
  if (existing) return existing;
  const flight = backendApi.recordGroupSettlement(groupId, expenseId, splitId, amountPaise, mutationId).finally(() => settlementFlights.delete(mutationId));
  settlementFlights.set(mutationId, flight);
  return flight;
};

const reverseSettlementOnce = (groupId: string, expenseId: string, settlementId: string, mutationId: string) => {
  const existing = reversalFlights.get(mutationId);
  if (existing) return existing;
  const flight = backendApi.reverseGroupSettlement(groupId, expenseId, settlementId, mutationId).finally(() => reversalFlights.delete(mutationId));
  reversalFlights.set(mutationId, flight);
  return flight;
};

interface GroupState {
  groups: Group[];
  expenses: GroupExpense[];

  addGroup: (group: Omit<Group, 'id' | 'created_at'>) => Promise<Group>;
  addPeopleToGroup: (groupId: string, names: string[]) => Promise<void>;
  addGroupExpense: (expense: Omit<GroupExpense, 'id' | 'created_at'>) => Promise<GroupExpense>;
  recordSettlement: (expenseId: string, splitId: string, amountPaise: number, mutationId: string) => Promise<Settlement>;
  reverseSettlement: (expenseId: string, settlementId: string, mutationId: string) => Promise<void>;
  retryGroupSync: (groupId: string) => Promise<void>;
  retryExpenseSync: (expenseId: string) => Promise<void>;
  deleteGroup: (id: string) => void;
  archiveGroup: (id: string) => Promise<void>;
  restoreGroup: (id: string) => Promise<void>;
  getGroupExpenses: (groupId: string) => GroupExpense[];
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      expenses: [],

      addPeopleToGroup: async (groupId, names) => {
        const group = get().groups.find(item => item.id === groupId);
        const owner = useAuthStore.getState().user?.id;
        if (!group || !owner || group.created_by !== owner || group.archived) throw new Error('This group is unavailable.');
        if (group.pending_action === 'members') { await get().retryGroupSync(groupId); return; }
        if (!isDemoModeEnabled() && group.sync_status !== 'confirmed') throw new Error('Confirm the existing group update first.');
        const normalized = new Set((group.members ?? []).map(member => member.user_name?.trim().toLocaleLowerCase()));
        const cleaned = names.map(name => name.trim()).filter(name => {
          if (!name || normalized.has(name.toLocaleLowerCase())) return false;
          if (name.length > 120) throw new Error('Use a person name of up to 120 characters.');
          normalized.add(name.toLocaleLowerCase()); return true;
        });
        if (!cleaned.length) return;
        const mutationId = createClientMutationId('members');
        const members = [...(group.members ?? []), ...cleaned.map((name, index) => ({ id: `member_${mutationId}_${index}`, group_id: groupId, user_id: `ledger_${mutationId}_${index}`, role: 'member' as const, joined_at: new Date().toISOString(), user_name: name }))];
        set(state => ({ groups: state.groups.map(item => item.id === groupId ? { ...item, members, sync_status: 'pending', pending_action: 'members', sync_error: undefined } : item) }));
        await get().retryGroupSync(groupId);
        if (useAuthStore.getState().user?.id === owner) void requestAutomaticBackup('group people added');
      },

      addGroup: async (group) => {
        const mutationId = group.mutation_id ?? createClientMutationId('group');
        const existing = get().groups.find((item) => item.mutation_id === mutationId);
        if (existing) {
          await get().retryGroupSync(existing.id);
          return get().groups.find((item) => item.id === existing.id) ?? existing;
        }
        const groupId = `grp_${mutationId}`;
        const newGroup: Group = {
          ...group,
          id: groupId,
          mutation_id: mutationId,
          sync_status: isDemoModeEnabled() ? 'confirmed' : 'pending',
          pending_action: isDemoModeEnabled() ? undefined : 'create',
          created_at: new Date().toISOString(),
          archived: group.archived ?? false,
          members: group.members?.map((member) => ({ ...member, group_id: groupId })),
        };
        set((state) => ({ groups: [newGroup, ...state.groups] }));
        try {
          await syncGroupCreateOnce(newGroup);
          set((state) => ({ groups: state.groups.map((item) => item.id === groupId ? { ...item, sync_status: 'confirmed', sync_error: undefined, pending_action: undefined } : item) }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Group could not be synchronized.';
          set((state) => ({ groups: state.groups.map((item) => item.id === groupId ? { ...item, sync_status: isUnknownMutationOutcome(error) ? 'pending' : 'failed', sync_error: message } : item) }));
          throw new Error(message);
        }
        void recordAppNotification({
          title: 'Group created',
          body: newGroup.name,
          type: 'system',
          actionRoute: '/(tabs)/groups',
        });
        void requestAutomaticBackup('group added');
        return get().groups.find((item) => item.id === groupId) ?? newGroup;
      },

      addGroupExpense: async (expense) => {
        const mutationId = expense.mutation_id ?? createClientMutationId('expense');
        const existing = get().expenses.find((item) => item.mutation_id === mutationId);
        if (existing) {
          await get().retryExpenseSync(existing.id);
          return get().expenses.find((item) => item.id === existing.id) ?? existing;
        }
        const expenseId = `ge_${mutationId}`;
        const newExpense: GroupExpense = {
          ...expense,
          id: expenseId,
          mutation_id: mutationId,
          sync_status: isDemoModeEnabled() ? 'confirmed' : 'pending',
          created_at: new Date().toISOString(),
          splits: expense.splits?.map((split, index) => ({
            ...split,
            id: split.id || `${expenseId}_split_${index}`,
            group_expense_id: expenseId,
          })),
        };
        set((state) => ({ expenses: appendExpenseIdempotently(state.expenses, newExpense).expenses }));
        try {
          await syncGroupExpenseCreateOnce(newExpense);
          set((state) => ({ expenses: state.expenses.map((item) => item.id === expenseId ? { ...item, sync_status: 'confirmed', sync_error: undefined } : item) }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Expense could not be synchronized.';
          set((state) => ({ expenses: state.expenses.map((item) => item.id === expenseId ? { ...item, sync_status: isUnknownMutationOutcome(error) ? 'pending' : 'failed', sync_error: message } : item) }));
          throw new Error(message);
        }
        void requestAutomaticBackup('group expense added');
        return get().expenses.find((item) => item.id === expenseId) ?? newExpense;
      },

      recordSettlement: async (expenseId, splitId, amountPaise, mutationId) => {
        const original = get().expenses.find((item) => item.id === expenseId);
        if (!original) throw new Error('Expense not found. Refresh the ledger and try again.');
        if (original.sync_status !== 'confirmed' && !isDemoModeEnabled()) {
          throw new Error('Wait for this expense to be confirmed before recording a settlement.');
        }
        if ((original.settlements ?? []).some((event) => event.split_id === splitId && event.mutation_id !== mutationId && event.sync_status !== 'confirmed')) {
          throw new Error('A settlement for this balance is awaiting confirmation. Retry that record first.');
        }
        const result = recordSettlementEvent(original, { splitId, amountPaise, mutationId });
        if (result.replayed && (isDemoModeEnabled() || result.settlement.sync_status === 'confirmed')) return result.settlement;
        const pendingExpense = {
          ...result.expense,
          settlements: result.expense.settlements?.map((item) => item.id === result.settlement.id
            ? { ...item, sync_status: isDemoModeEnabled() ? 'confirmed' as const : 'pending' as const }
            : item),
        };
        set((state) => ({ expenses: state.expenses.map((item) => item.id === expenseId ? pendingExpense : item) }));
        try {
          if (!isDemoModeEnabled()) {
            const response = await recordSettlementOnce(original.group_id, expenseId, splitId, amountPaise, mutationId);
            set((state) => ({ expenses: state.expenses.map((item) => item.id === expenseId ? reconcileConfirmedExpense(response.item, item) : item) }));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Settlement could not be synchronized.';
          set((state) => ({ expenses: state.expenses.map((item) => item.id === expenseId ? {
            ...item,
            settlements: item.settlements?.map((settlement) => settlement.id === result.settlement.id
              ? { ...settlement, sync_status: isUnknownMutationOutcome(error) ? 'pending' : 'failed', sync_error: message }
              : settlement),
          } : item) }));
          throw new Error(message);
        }
        void requestAutomaticBackup('settlement recorded');
        return result.settlement;
      },

      reverseSettlement: async (expenseId, settlementId, mutationId) => {
        const original = get().expenses.find((item) => item.id === expenseId);
        if (!original) throw new Error('Expense not found.');
        const reversed = reverseSettlementEvent(original, settlementId, mutationId);
        const updated = { ...reversed, settlements: reversed.settlements?.map((event) => event.mutation_id === mutationId
          ? { ...event, sync_status: isDemoModeEnabled() ? 'confirmed' as const : 'pending' as const }
          : event) };
        set((state) => ({ expenses: state.expenses.map((item) => item.id === expenseId ? updated : item) }));
        try {
          if (!isDemoModeEnabled()) {
            const response = await reverseSettlementOnce(original.group_id, expenseId, settlementId, mutationId);
            set((state) => ({ expenses: state.expenses.map((item) => item.id === expenseId ? reconcileConfirmedExpense(response.item, item) : item) }));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Settlement correction could not be confirmed.';
          if (isUnknownMutationOutcome(error)) {
            set((state) => ({ expenses: state.expenses.map((item) => item.id === expenseId ? {
              ...item,
              settlements: item.settlements?.map((event) => event.mutation_id === mutationId ? { ...event, sync_status: 'pending', sync_error: message } : event),
            } : item) }));
          } else {
            set((state) => ({ expenses: state.expenses.map((item) => item.id === expenseId ? original : item) }));
          }
          throw new Error(message);
        }
        void requestAutomaticBackup('settlement reversed');
      },

      retryGroupSync: async (groupId) => {
        const group = get().groups.find((item) => item.id === groupId);
        if (!group) return;
        set((state) => ({ groups: state.groups.map((item) => item.id === groupId ? { ...item, sync_status: 'pending', sync_error: undefined } : item) }));
        try {
          await syncGroupCreateOnce(group);
          set((state) => ({ groups: state.groups.map((item) => item.id === groupId ? { ...item, sync_status: 'confirmed', sync_error: undefined, pending_action: undefined, archived: group.pending_action === 'archive' ? true : group.pending_action === 'restore' ? false : item.archived } : item) }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Group could not be synchronized.';
          set((state) => ({ groups: state.groups.map((item) => item.id === groupId ? { ...item, sync_status: isUnknownMutationOutcome(error) ? 'pending' : 'failed', sync_error: message } : item) }));
          throw new Error(message);
        }
      },

      retryExpenseSync: async (expenseId) => {
        const expense = get().expenses.find((item) => item.id === expenseId);
        if (!expense) return;
        set((state) => ({ expenses: state.expenses.map((item) => item.id === expenseId ? { ...item, sync_status: 'pending', sync_error: undefined } : item) }));
        try {
          await syncGroupExpenseCreateOnce(expense);
          set((state) => ({ expenses: state.expenses.map((item) => item.id === expenseId ? { ...item, sync_status: 'confirmed', sync_error: undefined } : item) }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Expense could not be synchronized.';
          set((state) => ({ expenses: state.expenses.map((item) => item.id === expenseId ? { ...item, sync_status: isUnknownMutationOutcome(error) ? 'pending' : 'failed', sync_error: message } : item) }));
          throw new Error(message);
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

      archiveGroup: async (id) => {
        const group = get().groups.find((item) => item.id === id);
        if (!group || group.sync_status !== 'confirmed') throw new Error('Wait for the group to be confirmed before archiving it.');
        set((state) => ({ groups: state.groups.map((group) => group.id === id ? { ...group, sync_status: 'pending', pending_action: 'archive', sync_error: undefined } : group) }));
        await get().retryGroupSync(id);
        void requestAutomaticBackup('group archived');
      },

      restoreGroup: async (id) => {
        const group = get().groups.find((item) => item.id === id);
        if (!group || group.sync_status !== 'confirmed') throw new Error('Wait for the group to be confirmed before restoring it.');
        set((state) => ({ groups: state.groups.map((group) => group.id === id ? { ...group, sync_status: 'pending', pending_action: 'restore', sync_error: undefined } : group) }));
        await get().retryGroupSync(id);
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
