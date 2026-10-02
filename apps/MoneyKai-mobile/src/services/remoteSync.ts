import { useLocalLedgerStore } from '@/stores/useLocalLedgerStore';
import { LARGE_SMS_LOCAL_ENABLED } from '@/config/largeSmsFeatures';
import { mergeLedgerSnapshot } from './mergeLedgerSnapshot';
import { useAuthStore } from '@/stores/useAuthStore';
import { isCloudApprovedSmsTransaction } from '@moneykai/domain/transactionImports';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { reconcileGroupSnapshot } from '@/utils/groupExpense';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useBadgeStore } from '@/stores/useBadgeStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { useLinkedAccountStore } from '@/stores/useLinkedAccountStore';
import { clearSyncQueue } from './syncQueue';
import { clearAutomaticBackupQueue } from './backupService';
import { loadUserFirestoreSnapshot, type FirestoreUserSnapshot } from './firestoreData';
import { getNetworkStatus, readDataCache, retryAsync, writeDataCache } from './networkClient';
import { DEFAULT_THEME_PALETTE, getPaletteForThemeMode, getThemeModeForPalette } from '@/constants/theme';
import {
  captureRemoteSyncSession,
  isRemoteSyncSessionCurrent,
  type RemoteSyncSession,
} from '@moneykai/domain/syncSession';

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

type SyncOptions = { force?: boolean; keepLocalData?: boolean };
let activeSync: { userId: string; force: boolean; promise: Promise<RemoteSyncResult> } | null = null;

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

export const resetLocalAppState = ({ preserveGroupStore = false }: { preserveGroupStore?: boolean } = {}) => {
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
    appLockEnabled: false,
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

  if (!preserveGroupStore) {
    useGroupStore.setState({ groups: [], expenses: [] });
  }

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

const applyRemoteSnapshot = async (snapshot: FirestoreUserSnapshot, source: 'cache' | 'network') => {
  if(LARGE_SMS_LOCAL_ENABLED) await mergeLedgerSnapshot(snapshot.data.transactions);
  const deviceOnlyTransactions = useTransactionStore.getState().transactions.filter(t => t.captureSource === 'sms' || t.captureSource === 'notification');
  const userId = useAuthStore.getState().user?.id;
  const { groups: mergedGroups, expenses: mergedExpenses } = reconcileGroupSnapshot(
    snapshot.data.groups, snapshot.data.groupExpenses,
    useGroupStore.getState().groups, useGroupStore.getState().expenses,
    userId ?? '', source,
  );
  resetLocalAppState({ preserveGroupStore: true });

  const restoredPalette = snapshot.settings.app.themePalette ?? getPaletteForThemeMode(snapshot.settings.app.theme);
  const restoredDarkMode = false;

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
    dashboardTrendRange: snapshot.settings.app.dashboardTrendRange ?? '1m',
    dashboardTrendMetric: snapshot.settings.app.dashboardTrendMetric ?? 'spending',
    dashboardTrendChartType: snapshot.settings.app.dashboardTrendChartType ?? 'line',
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
    transactions: LARGE_SMS_LOCAL_ENABLED ? useLocalLedgerStore.getState().transactions : [...deviceOnlyTransactions, ...snapshot.data.transactions.filter(t =>
      (t.captureSource !== 'sms' || isCloudApprovedSmsTransaction(t)) && t.captureSource !== 'notification' && !deviceOnlyTransactions.some(local => local.id === t.id || (t.importIdentity && local.importIdentity === t.importIdentity)))],
    isSeeded: true,
  });

  useNotesStore.setState({
    ...useNotesStore.getState(),
    notes: snapshot.data.notes,
    isSeeded: true,
  });

  useGroupStore.setState({
    ...useGroupStore.getState(),
    groups: mergedGroups,
    expenses: mergedExpenses,
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

const isCurrentSession = (session: RemoteSyncSession) =>
  isRemoteSyncSessionCurrent(session, useAuthStore.getState().user?.id);

const localDataState = (): unknown[] => [
  useSettingsStore.getState(),
  useBudgetStore.getState(),
  useTransactionStore.getState(),
  useNotesStore.getState(),
  useGroupStore.getState(),
  useChallengeStore.getState(),
  useBadgeStore.getState(),
  useNotificationStore.getState(),
  useLinkedAccountStore.getState(),
];

const hydrateCachedSnapshot = async (userId: string, session: RemoteSyncSession, applyToStores: boolean) => {
  const cached = await readDataCache<FirestoreUserSnapshot>(remoteSnapshotCacheKey(userId));
  if (!cached || !isCurrentSession(session)) {
    return null;
  }

  if (applyToStores) await applyRemoteSnapshot(cached.value, 'cache');
  useSyncStore.getState().markCacheHydrated(cached.cachedAt);
  return cached;
};

export const syncRemoteState = (options: SyncOptions = {}): Promise<RemoteSyncResult> => {
  const profile = getUserProfile();
  if (!profile) {
    return Promise.resolve({ source: 'none', synced: false });
  }

  if (activeSync?.userId === profile.id) {
    if (options.force && !activeSync.force) {
      return activeSync.promise.then(() => syncRemoteState(options));
    }
    return activeSync.promise;
  }

  const promise = performRemoteSync(profile, options).finally(() => {
    if (activeSync?.promise === promise) activeSync = null;
  });
  activeSync = { userId: profile.id, force: options.force ?? false, promise };
  return promise;
};

const performRemoteSync = async (
  profile: NonNullable<ReturnType<typeof getUserProfile>>,
  { force = false, keepLocalData = false }: SyncOptions,
): Promise<RemoteSyncResult> => {
  const session = captureRemoteSyncSession(profile.id);

  useSyncStore.getState().startSync();
  const cached = await hydrateCachedSnapshot(profile.id, session, !keepLocalData);
  const initialLocalState = keepLocalData ? localDataState() : null;
  if (!isCurrentSession(session)) {
    return { source: 'none', synced: false };
  }
  const networkStatus = await getNetworkStatus().catch(() => null);
  if (!isCurrentSession(session)) {
    return { source: 'none', synced: false };
  }
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
    if (!isCurrentSession(session)) {
      return { source: 'none', synced: false };
    }
    if (initialLocalState && localDataState().some((state, index) => state !== initialLocalState[index])) {
      const message = 'Local data changed during refresh. Your changes were kept; refresh again to check the cloud.';
      useSyncStore.getState().failSync(message);
      return { source: cached ? 'cache' : 'none', synced: false, cachedAt: cached?.cachedAt, error: message };
    }
    await applyRemoteSnapshot(snapshot, 'network');
    if (!isCurrentSession(session)) {
      return { source: 'none', synced: false };
    }
    const nextCache = await writeDataCache(
      remoteSnapshotCacheKey(profile.id),
      snapshot,
      REMOTE_SNAPSHOT_CACHE_TTL_MS,
    );
    if (!isCurrentSession(session)) {
      return { source: 'none', synced: false };
    }
    useSyncStore.getState().markCacheHydrated(nextCache.cachedAt);
    useSyncStore.getState().finishSync(nextCache.cachedAt);
    return { source: 'network', synced: true, cachedAt: nextCache.cachedAt };
  } catch (error) {
    if (!isCurrentSession(session)) {
      return { source: 'none', synced: false };
    }
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
  const { LARGE_SMS_LOCAL_ENABLED, APPROVED_SMS_CLOUD_ENABLED } = await import('@/config/largeSmsFeatures');
  if(LARGE_SMS_LOCAL_ENABLED || APPROVED_SMS_CLOUD_ENABLED) {
    const { ledgerRequest } = await import('./localLedger');
    await ledgerRequest('',{op:'owner'});
  }
  const { useCaptureStore } = await import('@/stores/useCaptureStore');
  const { setNativeCaptureSourcesEnabled, clearNativeCaptureQueue, setNativeApprovedSmsAccounts, setPaymentNotificationPackages } = await import('@/services/nativeCaptureBridge');
  await setNativeCaptureSourcesEnabled({ notificationEnabled: false, smsEnabled: false });
  await setPaymentNotificationPackages([]);
  await clearNativeCaptureQueue();
  await setNativeApprovedSmsAccounts([]);
  useCaptureStore.setState({ signals: [], drafts: [], merchantRules: [], monitoredAccounts: [], settings: { ...useCaptureStore.getState().settings, autoCaptureEnabled: false, smsResearchModeEnabled: false, smsResearchExplainerAcceptedAt: undefined, smsConsentVersion: undefined, smsConsentUserId: undefined } });
  await clearSyncQueue();
  useSyncStore.getState().setPendingCount(0);
  await clearAutomaticBackupQueue();
};
