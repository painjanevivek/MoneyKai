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
import { useLinkedAccountStore } from '@/stores/useLinkedAccountStore';
import { clearSyncQueue } from './syncQueue';
import { clearAutomaticBackupQueue } from './backupService';
import { loadUserFirestoreSnapshot, type FirestoreUserSnapshot } from './firestoreData';
import { getNetworkStatus, readDataCache, retryAsync, writeDataCache } from './networkClient';
import { DEFAULT_THEME_PALETTE, getPaletteForThemeMode, getThemeModeForPalette, isThemeModeDark } from '@/constants/theme';

const REMOTE_SNAPSHOT_CACHE_TTL_MS = 10 * 60 * 1000;

const EMPTY_BUDGET_SETTINGS = {
  monthly_allowance: 0,
  reset_day: 1,
  auto_reset: true,
  carry_forward: false,
  currency: 'INR',
  category_limits: {},
};

type RemoteSyncResult = {
  source: 'network' | 'cache' | 'none';
  synced: boolean;
  cachedAt?: string;
  error?: string;
};

const remoteSnapshotCacheKey = (userId: string) => `remote-snapshot:${userId}`;

const getUserProfile = () => {
  const user = useAuthStore.getState().user;
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    auth_provider: user.auth_provider,
    dob: user.dob,
    gender: user.gender,
  };
};

export const resetLocalAppState = () => {
  const theme = getThemeModeForPalette(DEFAULT_THEME_PALETTE, false);
  useSettingsStore.setState({
    theme,
    themePalette: DEFAULT_THEME_PALETTE,
    darkModeEnabled: false,
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
  useSyncStore.getState().setPendingCount(0);
  void clearAutomaticBackupQueue();
};

const applyRemoteSnapshot = (snapshot: FirestoreUserSnapshot) => {
  resetLocalAppState();

  const restoredPalette = snapshot.settings.app.themePalette ?? getPaletteForThemeMode(snapshot.settings.app.theme);
  const restoredDarkMode = snapshot.settings.app.darkModeEnabled ?? isThemeModeDark(snapshot.settings.app.theme);

  useSettingsStore.setState({
    theme: getThemeModeForPalette(restoredPalette, restoredDarkMode),
    themePalette: restoredPalette,
    darkModeEnabled: restoredDarkMode,
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

  const savings = snapshot.data.savings ?? snapshot.data.challenges;
  useChallengeStore.setState({
    ...useChallengeStore.getState(),
    challenges: savings,
    totalXP: savings.reduce((sum, item) => sum + (item.xp_earned ?? 0), 0),
  });

  useBadgeStore.setState({
    ...useBadgeStore.getState(),
    badges: snapshot.data.badges,
  });

  useNotificationStore.getState().replaceNotifications((snapshot.data.notifications ?? []) as never[]);
  useLinkedAccountStore.getState().replaceAccounts(snapshot.data.linkedAccounts ?? []);
};

const hydrateCachedSnapshot = async (userId: string) => {
  const cached = await readDataCache<FirestoreUserSnapshot>(remoteSnapshotCacheKey(userId));
  if (!cached) {
    return null;
  }

  applyRemoteSnapshot(cached.value);
  useSyncStore.getState().markCacheHydrated(cached.cachedAt);
  return cached;
};

export const syncRemoteState = async ({
  force = false,
}: { force?: boolean } = {}): Promise<RemoteSyncResult> => {
  const profile = getUserProfile();
  if (!profile) {
    return { source: 'none', synced: false };
  }

  useSyncStore.getState().startSync();
  const cached = await hydrateCachedSnapshot(profile.id);
  const networkStatus = await getNetworkStatus().catch(() => null);
  useSyncStore.getState().setOnline(networkStatus?.isOnline ?? true);

  if (cached && !force && cached.expiresAt && new Date(cached.expiresAt).getTime() > Date.now()) {
    useSyncStore.getState().finishSync(cached.cachedAt);
    return { source: 'cache', synced: true, cachedAt: cached.cachedAt };
  }

  if (networkStatus && !networkStatus.isOnline) {
    const message = cached
      ? 'Using cached data until the connection returns.'
      : 'You are offline and no cached account data is available on this device.';
    useSyncStore.getState().failSync(message);
    return { source: cached ? 'cache' : 'none', synced: !!cached, cachedAt: cached?.cachedAt, error: message };
  }

  try {
    const snapshot = await retryAsync(
      () => loadUserFirestoreSnapshot(profile.id, profile),
      { retries: force ? 3 : 2, baseDelayMs: 500 },
    );
    applyRemoteSnapshot(snapshot);
    const nextCache = await writeDataCache(
      remoteSnapshotCacheKey(profile.id),
      snapshot,
      REMOTE_SNAPSHOT_CACHE_TTL_MS,
    );
    useSyncStore.getState().markCacheHydrated(nextCache.cachedAt);
    useSyncStore.getState().finishSync(nextCache.cachedAt);
    return { source: 'network', synced: true, cachedAt: nextCache.cachedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not sync account data.';
    useSyncStore.getState().failSync(cached ? 'Using cached data because the latest sync failed.' : message);
    return {
      source: cached ? 'cache' : 'none',
      synced: !!cached,
      cachedAt: cached?.cachedAt,
      error: message,
    };
  }
};

export const clearTransientSessionState = async () => {
  await clearSyncQueue();
  useSyncStore.getState().setPendingCount(0);
  await clearAutomaticBackupQueue();
};
