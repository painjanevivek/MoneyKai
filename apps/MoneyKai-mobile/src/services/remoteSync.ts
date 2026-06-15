import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useBadgeStore } from '@/stores/useBadgeStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { clearSyncQueue } from './syncQueue';
import { clearAutomaticBackupQueue } from './backupService';
import { loadUserFirestoreSnapshot } from './firestoreData';

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
  const user = useAuthStore.getState().user;
  if (!user) {
    return;
  }

  const snapshot = await loadUserFirestoreSnapshot(user.id, {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    auth_provider: user.auth_provider,
  });

  resetLocalAppState();

  useSettingsStore.setState({
    theme: snapshot.settings.app.theme,
    currency: snapshot.settings.app.currency,
    currencySymbol: snapshot.settings.app.currencySymbol,
    notificationsEnabled: snapshot.settings.app.notificationsEnabled,
    hapticEnabled: snapshot.settings.app.hapticEnabled,
    tourCompleted: snapshot.settings.app.tourCompleted ?? false,
    appLockEnabled: snapshot.settings.app.appLockEnabled ?? false,
  });

  useBudgetStore.setState({
    ...useBudgetStore.getState(),
    settings: snapshot.settings.budget.settings,
    adjustments: snapshot.settings.budget.adjustments,
    isEmergencyMode: snapshot.settings.budget.isEmergencyMode,
    resetHistory: snapshot.settings.budget.resetHistory,
  });

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
    challenges: snapshot.data.savings,
    totalXP: snapshot.data.savings.reduce((sum, item) => sum + (item.xp_earned ?? 0), 0),
  });

  useBadgeStore.setState({
    ...useBadgeStore.getState(),
    badges: snapshot.data.badges,
  });

  useNotificationStore.getState().replaceNotifications((snapshot.data.notifications ?? []) as never[]);
  useSyncStore.getState().startSync();
  useSyncStore.getState().finishSync();
};

export const clearTransientSessionState = async () => {
  await clearSyncQueue();
  useSyncStore.getState().setPendingCount(0);
  await clearAutomaticBackupQueue();
};
