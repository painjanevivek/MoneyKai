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
import { linkedAccountProviderApi } from '@/services/linkedAccountProviderApi';
import { buildLinkedAccountTransactions } from '@/services/linkedAccountImport';
import { isLinkedAccountDemoEnabled } from '@/config/environment';
import { queueAutomaticBackup } from '@/services/automaticBackupClient';
import type { LinkedAccountConnectStartResponse, LinkedAccountProviderStatus } from '@/types/linkedAccountProvider';
import { useAuthStore } from './useAuthStore';
import { useTransactionStore } from './useTransactionStore';

type LinkedAccountState = {
  accounts: LinkedAccount[];
  selectedAccountId?: string;
  lastGlobalSyncAt?: string;
  isSyncing: boolean;
  isProviderActionPending: boolean;
  providerStatus?: LinkedAccountProviderStatus;
  providerError?: string;

  getActiveAccounts: () => LinkedAccount[];
  getSummary: () => ReturnType<typeof summarizeLinkedAccounts>;
  getInsights: () => ReturnType<typeof getLinkedAccountInsights>;

  refreshProviderStatus: () => Promise<LinkedAccountProviderStatus>;
  startLiveConnection: () => Promise<LinkedAccountConnectStartResponse>;
  connectSandboxAccounts: (userId?: string) => void;
  addManualAccount: (draft: LinkedAccountDraft, userId?: string) => void;
  syncAccount: (id: string) => Promise<void>;
  syncAllAccounts: () => Promise<void>;
  pauseAccount: (id: string) => void;
  resumeAccount: (id: string) => void;
  disconnectAccount: (id: string) => void;
  removeDemoAccounts: () => void;
  setSelectedAccountId: (id?: string) => void;
  replaceAccounts: (accounts: LinkedAccount[]) => void;
  clearAccounts: () => void;
};

const COLLECTION = 'linkedAccounts';

const getOwnerId = (userId?: string) =>
  userId ?? useAuthStore.getState().user?.id ?? 'local';

const queueBackup = queueAutomaticBackup;

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

const isRemoteProviderAccount = (account: LinkedAccount) =>
  account.provider !== 'manual' && account.provider !== 'sandbox';

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
      isProviderActionPending: false,
      providerStatus: undefined,
      providerError: undefined,

      getActiveAccounts: () =>
        get().accounts.filter((account) => account.status !== 'disconnected'),

      getSummary: () => summarizeLinkedAccounts(get().accounts),

      getInsights: () => getLinkedAccountInsights(get().accounts),

      refreshProviderStatus: async () => {
        set({ isProviderActionPending: true, providerError: undefined });
        try {
          const providerStatus = await linkedAccountProviderApi.getStatus();
          set({ providerStatus, isProviderActionPending: false });
          return providerStatus;
        } catch (error) {
          const providerError = error instanceof Error ? error.message : 'Unable to check bank-linking provider status.';
          set({ providerError, isProviderActionPending: false });
          throw error;
        }
      },

      startLiveConnection: async () => {
        set({ isProviderActionPending: true, providerError: undefined });
        try {
          const response = await linkedAccountProviderApi.startConnection();
          set({ isProviderActionPending: false });
          return response;
        } catch (error) {
          const providerError = error instanceof Error ? error.message : 'Unable to start live bank connection.';
          set({ providerError, isProviderActionPending: false });
          throw error;
        }
      },

      connectSandboxAccounts: (userId) => {
        if (!isLinkedAccountDemoEnabled()) {
          throw new Error('Demo linked accounts are disabled for this build.');
        }

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

      syncAccount: async (id) => {
        const targetAccount = get().accounts.find((account) => account.id === id);
        if (!targetAccount) {
          return;
        }

        if (isRemoteProviderAccount(targetAccount)) {
          const nowIso = new Date().toISOString();
          set((state) => ({
            accounts: state.accounts.map((account) =>
              account.id === id ? { ...account, status: 'syncing', updatedAt: nowIso } : account
            ),
          }));

          try {
            const response = await linkedAccountProviderApi.syncAccount(id);
            set((state) => ({
              accounts: mergeAccounts(state.accounts, response.accounts),
              selectedAccountId: state.selectedAccountId ?? response.accounts[0]?.id,
              lastGlobalSyncAt: response.syncedAt,
            }));
            response.accounts.forEach(syncAccountUpsert);
            useTransactionStore.getState().upsertImportedTransactions(response.transactions);
            queueBackup('live linked account synced');
          } catch (error) {
            const lastError = error instanceof Error ? error.message : 'Live account sync failed.';
            set((state) => ({
              accounts: state.accounts.map((account) =>
                account.id === id
                  ? { ...account, status: 'error', lastError, updatedAt: new Date().toISOString() }
                  : account
              ),
            }));
            throw error;
          }
          return;
        }

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
          if (syncedAccount.provider === 'sandbox') {
            useTransactionStore
              .getState()
              .upsertImportedTransactions(buildLinkedAccountTransactions(ownerId, [syncedAccount]));
          }
          queueBackup('linked account synced');
        }
      },

      syncAllAccounts: async () => {
        const remoteAccounts = get().accounts.filter(
          (account) =>
            isRemoteProviderAccount(account) &&
            account.status !== 'paused' &&
            account.status !== 'disconnected'
        );
        if (remoteAccounts.length > 0) {
          set({ isSyncing: true });
          try {
            const response = await linkedAccountProviderApi.syncAll();
            set((state) => ({
              accounts: mergeAccounts(state.accounts, response.accounts),
              selectedAccountId: state.selectedAccountId ?? response.accounts[0]?.id,
              lastGlobalSyncAt: response.syncedAt,
              isSyncing: false,
            }));
            response.accounts.forEach(syncAccountUpsert);
            useTransactionStore.getState().upsertImportedTransactions(response.transactions);
            queueBackup('live linked accounts synced');
            return;
          } catch (error) {
            const lastError = error instanceof Error ? error.message : 'Live account sync failed.';
            set((state) => ({
              accounts: state.accounts.map((account) =>
                remoteAccounts.some((remoteAccount) => remoteAccount.id === account.id)
                  ? { ...account, status: 'error', lastError, updatedAt: new Date().toISOString() }
                  : account
              ),
              isSyncing: false,
            }));
            throw error;
          }
        }

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
        const sandboxAccounts = nextAccounts.filter(
          (account) => account.provider === 'sandbox' && account.status !== 'paused' && account.status !== 'disconnected'
        );
        useTransactionStore
          .getState()
          .upsertImportedTransactions(
            buildLinkedAccountTransactions(
              ownerId,
              sandboxAccounts
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
        const removedAccount = get().accounts.find((account) => account.id === id);
        set((state) => {
          const accounts = state.accounts.filter((account) => account.id !== id);
          const selectedAccountId = state.selectedAccountId === id ? accounts[0]?.id : state.selectedAccountId;
          return { accounts, selectedAccountId };
        });
        syncAccountDelete(id);
        if (removedAccount?.provider === 'sandbox') {
          useTransactionStore.getState().removeImportedTransactionsForAccounts([removedAccount.id]);
        }
        queueBackup('linked account disconnected');
      },

      removeDemoAccounts: () => {
        const demoAccounts = get().accounts.filter((account) => account.provider === 'sandbox');
        if (demoAccounts.length === 0) return;

        const demoAccountIds = demoAccounts.map((account) => account.id);
        set((state) => {
          const accounts = state.accounts.filter((account) => account.provider !== 'sandbox');
          const selectedAccountId = state.selectedAccountId && demoAccountIds.includes(state.selectedAccountId)
            ? accounts[0]?.id
            : state.selectedAccountId;
          return {
            accounts,
            selectedAccountId,
            lastGlobalSyncAt: summarizeLinkedAccounts(accounts).lastSyncedAt,
          };
        });
        demoAccountIds.forEach(syncAccountDelete);
        useTransactionStore.getState().removeImportedTransactionsForAccounts(demoAccountIds);
        queueBackup('demo linked accounts removed');
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
          isProviderActionPending: false,
          providerError: undefined,
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
