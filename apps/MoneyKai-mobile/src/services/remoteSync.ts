import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useBadgeStore } from '@/stores/useBadgeStore';
import { backendApi, isBackendConfigured } from './backendApi';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { clearSyncQueue } from './syncQueue';
import { clearAutomaticBackupQueue } from './backupService';

const EMPTY_BUDGET_SETTINGS = {
  monthly_allowance: 0,
  reset_day: 1,
  auto_reset: true,
  carry_forward: false,
  currency: 'INR',
};

export const resetLocalAppState = () => {
  useSettingsStore.setState({
    theme: 'light',
    currency: 'INR',
    currencySymbol: '₹',
    notificationsEnabled: true,
    hapticEnabled: true,
    tourCompleted: false,
  });

  useBudgetStore.setState({
    settings: EMPTY_BUDGET_SETTINGS,
    adjustments: [],
    isEmergencyMode: false,
    resetHistory: [],
  });

  useTransactionStore.setState({
    transactions: [],
    filter: { dateRange: 'monthly', searchQuery: '' },
    isLoading: false,
    isSeeded: false,
  });

  useNotesStore.setState({
    notes: [],
    isSeeded: false,
  });

  useGroupStore.setState({
    groups: [],
    expenses: [],
  });

  useChallengeStore.setState({
    challenges: [],
    totalXP: 0,
  });

  useBadgeStore.setState({
    badges: [],
    recentUnlock: null,
  });

  useNotificationStore.getState().clearNotifications();
  useSyncStore.getState().setPendingCount(0);
  void clearAutomaticBackupQueue();
};

export const syncRemoteState = async () => {
  if (!isBackendConfigured()) {
    return;
  }

  const user = useAuthStore.getState().user;
  if (!user) {
    return;
  }

  const localBudgetState = useBudgetStore.getState();
  const syncStore = useSyncStore.getState();
  syncStore.startSync();

  try {
    const snapshot = await backendApi.getBootstrap();
    const snapshotBudget = snapshot.settings.budget;
    const shouldRecoverLocalBudget =
      snapshotBudget?.settings?.monthly_allowance === 0 &&
      localBudgetState.settings.monthly_allowance > 0;

    resetLocalAppState();

    useSettingsStore.setState({
      theme: snapshot.settings.app.theme,
      currency: snapshot.settings.app.currency,
      currencySymbol: snapshot.settings.app.currencySymbol,
      notificationsEnabled: snapshot.settings.app.notificationsEnabled,
      hapticEnabled: snapshot.settings.app.hapticEnabled,
      tourCompleted: snapshot.settings.app.tourCompleted ?? false,
    });

    useBudgetStore.setState({
      ...useBudgetStore.getState(),
      settings: shouldRecoverLocalBudget ? localBudgetState.settings : snapshotBudget.settings,
      adjustments: shouldRecoverLocalBudget ? localBudgetState.adjustments : snapshotBudget.adjustments,
      isEmergencyMode: shouldRecoverLocalBudget ? localBudgetState.isEmergencyMode : snapshotBudget.isEmergencyMode,
      resetHistory: shouldRecoverLocalBudget ? localBudgetState.resetHistory : snapshotBudget.resetHistory,
    });

    if (shouldRecoverLocalBudget) {
      void backendApi.updateBudgetSettings({
        settings: localBudgetState.settings,
        adjustments: localBudgetState.adjustments,
        isEmergencyMode: localBudgetState.isEmergencyMode,
        resetHistory: localBudgetState.resetHistory,
      }).catch((error) => {
        if (__DEV__) {
          console.warn('[MoneyKai] failed to recover local budget settings:', error);
        }
      });
    }

    useTransactionStore.setState({
      ...useTransactionStore.getState(),
      transactions: snapshot.data.transactions,
      isSeeded: true,
    });

    useNotesStore.setState({
      ...useNotesStore.getState(),
      notes: snapshot.data.notes,
      isSeeded: true,
    });

    useGroupStore.setState({
      ...useGroupStore.getState(),
      groups: snapshot.data.groups,
      expenses: snapshot.data.groupExpenses,
    });

    useChallengeStore.setState({
      ...useChallengeStore.getState(),
      challenges: snapshot.data.challenges,
      totalXP: snapshot.data.totalXP,
    });

    useBadgeStore.setState({
      ...useBadgeStore.getState(),
      badges: snapshot.data.badges,
    });

    useNotificationStore.getState().replaceNotifications(snapshot.data.notifications ?? []);
    syncStore.finishSync(snapshot.capturedAt);
  } catch (error) {
    syncStore.failSync(error instanceof Error ? error.message : 'Failed to sync remote data.');
    throw error;
  }
};

export const clearTransientSessionState = async () => {
  await clearSyncQueue();
  useSyncStore.getState().setPendingCount(0);
  await clearAutomaticBackupQueue();
};
