import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildSandboxLinkedAccounts,
  getLinkedAccountInsights,
  summarizeLinkedAccounts,
  toClientLinkedAccount,
  type LinkedAccount,
  type LinkedAccountDraft,
} from '@moneykai/domain';
import { deleteUserDoc, upsertUserDoc } from '@/services/firestoreData';
import { buildLinkedAccountTransactions } from '@/services/linkedAccountImport';
import { useAuthStore } from './useAuthStore';
import { useTransactionStore } from './useTransactionStore';

type LinkedAccountState = {
  accounts: LinkedAccount[];
  selectedAccountId?: string;
  lastGlobalSyncAt?: string;
  isSyncing: boolean;

  getActiveAccounts: () => LinkedAccount[];
  getSummary: () => ReturnType<typeof summarizeLinkedAccounts>;
  getInsights: () => ReturnType<typeof getLinkedAccountInsights>;

  connectSandboxAccounts: (userId?: string) => void;
  addManualAccount: (draft: LinkedAccountDraft, userId?: string) => void;
  syncAccount: (id: string) => void;
  syncAllAccounts: () => void;
  pauseAccount: (id: string) => void;
  resumeAccount: (id: string) => void;
  disconnectAccount: (id: string) => void;
  setSelectedAccountId: (id?: string) => void;
  replaceAccounts: (accounts: LinkedAccount[]) => void;
  clearAccounts: () => void;
};

const COLLECTION = 'linkedAccounts';

const getOwnerId = (userId?: string) =>
  userId ?? useAuthStore.getState().user?.id ?? 'local';

const queueBackup = (reason: string) => {
  void import('@/services/backupService')
    .then(({ requestAutomaticBackup }) => requestAutomaticBackup(reason))
    .catch(() => undefined);
};

const syncAccountUpsert = (account: LinkedAccount) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;

  void upsertUserDoc(COLLECTION, userId, toClientLinkedAccount(account)).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to sync linked account:', error);
    }
  });
};

const syncAccountDelete = (id: string) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;

  void deleteUserDoc(COLLECTION, userId, id).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to delete linked account:', error);
    }
  });
};

const mergeAccounts = (existing: LinkedAccount[], incoming: LinkedAccount[]) => {
  const byId = new Map(existing.map((account) => [account.id, account]));
  incoming.forEach((account) => byId.set(account.id, account));
  return Array.from(byId.values())
    .map(toClientLinkedAccount)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

const createManualAccount = (
  draft: LinkedAccountDraft,
  userId: string,
  nowIso: string
): LinkedAccount => ({
  id: `linked_manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  userId,
  provider: 'manual',
  institutionName: draft.institutionName.trim(),
  displayName: draft.displayName.trim(),
  kind: draft.kind,
  maskedAccountNumber: draft.maskedAccountNumber?.trim() || undefined,
  status: 'connected',
  balance: {
    current: draft.currentBalance,
    available: draft.availableBalance ?? draft.currentBalance,
    limit: draft.limit,
    currency: draft.currency ?? 'INR',
    updatedAt: nowIso,
  },
  features: {
    balanceRefresh: false,
    transactionImport: false,
    reauth: false,
    webhookSync: false,
  },
  includeInBudget: draft.includeInBudget ?? draft.kind !== 'savings',
  includeInNetWorth: draft.includeInNetWorth ?? draft.kind !== 'credit_card',
  lastSyncedAt: nowIso,
  createdAt: nowIso,
  updatedAt: nowIso,
});

export const useLinkedAccountStore = create<LinkedAccountState>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedAccountId: undefined,
      lastGlobalSyncAt: undefined,
      isSyncing: false,

      getActiveAccounts: () =>
        get().accounts.filter((account) => account.status !== 'disconnected'),

      getSummary: () => summarizeLinkedAccounts(get().accounts),

      getInsights: () => getLinkedAccountInsights(get().accounts),

      connectSandboxAccounts: (userId) => {
        const ownerId = getOwnerId(userId);
        const sandboxAccounts = buildSandboxLinkedAccounts(ownerId);
        const transactions = buildLinkedAccountTransactions(ownerId, sandboxAccounts);
        const lastSyncedAt = sandboxAccounts[0]?.lastSyncedAt ?? new Date().toISOString();

        set((state) => {
          const nonSandboxAccounts = state.accounts.filter((account) => account.provider !== 'sandbox');
          return {
            accounts: mergeAccounts(nonSandboxAccounts, sandboxAccounts),
            selectedAccountId: state.selectedAccountId ?? sandboxAccounts[0]?.id,
            lastGlobalSyncAt: lastSyncedAt,
          };
        });

        sandboxAccounts.forEach(syncAccountUpsert);
        useTransactionStore.getState().upsertImportedTransactions(transactions);
        queueBackup('linked accounts connected');
      },

      addManualAccount: (draft, userId) => {
        const ownerId = getOwnerId(userId);
        const nowIso = new Date().toISOString();
        const account = createManualAccount(draft, ownerId, nowIso);

        set((state) => ({
          accounts: [account, ...state.accounts],
          selectedAccountId: account.id,
          lastGlobalSyncAt: nowIso,
        }));
        syncAccountUpsert(account);
        queueBackup('manual linked account added');
      },

      syncAccount: (id) => {
        const ownerId = getOwnerId();
        const nowIso = new Date().toISOString();
        let syncedAccount: LinkedAccount | undefined;

        set((state) => {
          const accounts = state.accounts.map((account) => {
            if (account.id !== id) return account;
            syncedAccount = {
              ...account,
              status: 'connected',
              lastError: undefined,
              lastSyncedAt: nowIso,
              updatedAt: nowIso,
              balance: {
                ...account.balance,
                updatedAt: nowIso,
              },
            };
            return syncedAccount;
          });
          return { accounts, lastGlobalSyncAt: nowIso };
        });

        if (syncedAccount) {
          syncAccountUpsert(syncedAccount);
          useTransactionStore
            .getState()
            .upsertImportedTransactions(buildLinkedAccountTransactions(ownerId, [syncedAccount]));
          queueBackup('linked account synced');
        }
      },

      syncAllAccounts: () => {
        const ownerId = getOwnerId();
        const nowIso = new Date().toISOString();
        let nextAccounts: LinkedAccount[] = [];

        set((state) => {
          nextAccounts = state.accounts.map((account) =>
            account.status === 'paused' || account.status === 'disconnected'
              ? account
              : {
                  ...account,
                  status: 'connected',
                  lastError: undefined,
                  lastSyncedAt: nowIso,
                  updatedAt: nowIso,
                  balance: { ...account.balance, updatedAt: nowIso },
                }
          );
          return { accounts: nextAccounts, lastGlobalSyncAt: nowIso, isSyncing: false };
        });

        nextAccounts.forEach(syncAccountUpsert);
        useTransactionStore
          .getState()
          .upsertImportedTransactions(
            buildLinkedAccountTransactions(
              ownerId,
              nextAccounts.filter((account) => account.status !== 'paused' && account.status !== 'disconnected')
            )
          );
        queueBackup('linked accounts synced');
      },

      pauseAccount: (id) => {
        const nowIso = new Date().toISOString();
        let updatedAccount: LinkedAccount | undefined;
        set((state) => ({
          accounts: state.accounts.map((account) => {
            if (account.id !== id) return account;
            updatedAccount = { ...account, status: 'paused', updatedAt: nowIso };
            return updatedAccount;
          }),
        }));
        if (updatedAccount) {
          syncAccountUpsert(updatedAccount);
          queueBackup('linked account paused');
        }
      },

      resumeAccount: (id) => {
        get().syncAccount(id);
      },

      disconnectAccount: (id) => {
        set((state) => {
          const accounts = state.accounts.filter((account) => account.id !== id);
          const selectedAccountId = state.selectedAccountId === id ? accounts[0]?.id : state.selectedAccountId;
          return { accounts, selectedAccountId };
        });
        syncAccountDelete(id);
        queueBackup('linked account disconnected');
      },

      setSelectedAccountId: (id) => set({ selectedAccountId: id }),

      replaceAccounts: (accounts) =>
        set({
          accounts: accounts.map(toClientLinkedAccount),
          selectedAccountId: accounts[0]?.id,
          lastGlobalSyncAt: summarizeLinkedAccounts(accounts).lastSyncedAt,
        }),

      clearAccounts: () =>
        set({
          accounts: [],
          selectedAccountId: undefined,
          lastGlobalSyncAt: undefined,
          isSyncing: false,
        }),
    }),
    {
      name: 'moneykai-linked-accounts',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accounts: state.accounts.map(toClientLinkedAccount),
        selectedAccountId: state.selectedAccountId,
        lastGlobalSyncAt: state.lastGlobalSyncAt,
      }),
    }
  )
);
