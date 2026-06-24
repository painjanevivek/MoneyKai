import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useBadgeStore } from '@/stores/useBadgeStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useLinkedAccountStore } from '@/stores/useLinkedAccountStore';
import { clearAutomaticBackupQueue } from './automaticBackupQueue';
import { loadUserFirestoreSnapshot } from './firestoreData';
import { DEFAULT_THEME_PALETTE, getDefaultedThemePalette, getPaletteForThemeMode, getThemeModeForPalette, isThemeModeDark } from '@/constants/theme';

const EMPTY_BUDGET_SETTINGS = {
  monthly_allowance: 0,
  reset_day: 1,
  auto_reset: true,
  carry_forward: false,
  currency: 'INR',
};

export const resetLocalAppState = () => {
  const theme = getThemeModeForPalette(DEFAULT_THEME_PALETTE, true);
  useSettingsStore.setState({
    theme,
    themePalette: DEFAULT_THEME_PALETTE,
    darkModeEnabled: true,
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
  useLinkedAccountStore.getState().clearAccounts();
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
    dob: user.dob,
    gender: user.gender,
  });

  resetLocalAppState();

  const rawRestoredPalette = snapshot.settings.app.themePalette ?? getPaletteForThemeMode(snapshot.settings.app.theme);
  const restoredPalette = getDefaultedThemePalette(rawRestoredPalette, snapshot.settings.app.theme);
  const migratedToDefault = restoredPalette === DEFAULT_THEME_PALETTE && rawRestoredPalette !== DEFAULT_THEME_PALETTE;
  const restoredDarkMode = migratedToDefault ? true : snapshot.settings.app.darkModeEnabled ?? isThemeModeDark(snapshot.settings.app.theme);

  useSettingsStore.setState({
    theme: getThemeModeForPalette(restoredPalette, restoredDarkMode),
    themePalette: restoredPalette,
    darkModeEnabled: restoredDarkMode,
    currency: snapshot.settings.app.currency,
    currencySymbol: snapshot.settings.app.currencySymbol,
    notificationsEnabled: snapshot.settings.app.notificationsEnabled,
    hapticEnabled: snapshot.settings.app.hapticEnabled,
    tourCompleted: snapshot.settings.app.tourCompleted ?? false,
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
  useLinkedAccountStore.getState().replaceAccounts(snapshot.data.linkedAccounts ?? []);
};

export const clearTransientSessionState = async () => {
  await clearAutomaticBackupQueue();
};
