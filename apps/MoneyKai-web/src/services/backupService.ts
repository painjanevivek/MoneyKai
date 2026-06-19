import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { recordAppNotification } from './notificationService';
import type { BudgetAdjustment, BudgetSettings } from '@/types/budget';
import type { Transaction } from '@/types/transaction';
import type { Note } from '@/types/note';
import type { Group, GroupExpense } from '@/types/group';
import type { Challenge } from '@/types/challenge';
import type { Badge } from '@/types/badge';
import type { AppNotification } from '@/types/notification';
import { getPaletteForThemeMode, getThemeModeForPalette, isThemeModeDark, type ThemeMode, type ThemePaletteId } from '@/constants/theme';
import type { LinkedAccount } from '@moneykai/domain';
import { firebaseDb, isFirebaseConfigured } from './firebase';
import { backendApi, isBackendConfigured } from './backendApi';

const AUTO_BACKUP_STATE_KEY = 'moneykai-auto-backup-state';
const AUTO_BACKUP_DEBOUNCE_MS = 10_000;
const AUTO_BACKUP_MIN_INTERVAL_MS = 60_000;

interface BackupAppSettings {
  theme: ThemeMode;
  themePalette?: ThemePaletteId;
  darkModeEnabled?: boolean;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
}

interface AutomaticBackupState {
  pending: boolean;
  sequence: number;
  queuedAt: number | null;
  lastBackupAt: number | null;
  reason: string | null;
}

const DEFAULT_AUTOMATIC_BACKUP_STATE: AutomaticBackupState = {
  pending: false,
  sequence: 0,
  queuedAt: null,
  lastBackupAt: null,
  reason: null,
};

let automaticBackupState: AutomaticBackupState | null = null;
let automaticBackupTimer: ReturnType<typeof setTimeout> | null = null;
let automaticBackupInFlight = false;

const loadAutomaticBackupState = async (): Promise<AutomaticBackupState> => {
  if (automaticBackupState) {
    return automaticBackupState;
  }

  try {
    const raw = await AsyncStorage.getItem(AUTO_BACKUP_STATE_KEY);
    automaticBackupState = raw ? { ...DEFAULT_AUTOMATIC_BACKUP_STATE, ...(JSON.parse(raw) as Partial<AutomaticBackupState>) } : { ...DEFAULT_AUTOMATIC_BACKUP_STATE };
  } catch {
    automaticBackupState = { ...DEFAULT_AUTOMATIC_BACKUP_STATE };
  }

  return automaticBackupState;
};

const persistAutomaticBackupState = async () => {
  if (!automaticBackupState) {
    return;
  }

  await AsyncStorage.setItem(AUTO_BACKUP_STATE_KEY, JSON.stringify(automaticBackupState));
};

const clearAutomaticBackupTimer = () => {
  if (automaticBackupTimer) {
    clearTimeout(automaticBackupTimer);
    automaticBackupTimer = null;
  }
};

const scheduleAutomaticBackup = () => {
  clearAutomaticBackupTimer();
  automaticBackupTimer = setTimeout(() => {
    void flushAutomaticBackup({ force: false });
  }, AUTO_BACKUP_DEBOUNCE_MS);
};

export interface MoneyKaiBackupSnapshot {
  version: 1;
  capturedAt: string;
  profile: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    auth_provider?: 'email' | 'google';
  };
  settings: {
    app: BackupAppSettings;
    budget: {
      settings: BudgetSettings;
      adjustments: BudgetAdjustment[];
      isEmergencyMode: boolean;
      resetHistory: { date: string; amount: number; carryForward: number }[];
    };
  };
  data: {
    transactions: Transaction[];
    notes: Note[];
    groups: Group[];
    groupExpenses: GroupExpense[];
    challenges: Challenge[];
    totalXP: number;
    badges: Badge[];
    notifications: AppNotification[];
    linkedAccounts?: LinkedAccount[];
  };
}

const normalizeUser = () => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error('You need to be signed in to back up or restore data.');
  }
  return user;
};

const formatBackupError = (error: unknown, action: 'save' | 'restore'): Error => {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code ?? '') : '';
  const baseMessage =
    action === 'save'
      ? 'Could not create the cloud backup.'
      : 'Could not restore the cloud backup.';

  switch (code) {
    case 'permission-denied':
      return new Error(
        `${baseMessage} Firestore is rejecting this request. Check your Firestore rules and make sure the signed-in user can read and write \`users/{uid}/backups\`.`
      );
    case 'failed-precondition':
    case 'unavailable':
      return new Error(
        `${baseMessage} Firestore may not be created yet in Firebase Console. Create the Firestore database, then try again.`
      );
    case 'not-found':
      return new Error(
        `${baseMessage} No backup collection exists yet for this account. Create one backup first.`
      );
    default:
      return error instanceof Error ? error : new Error(baseMessage);
  }
};

export const clearAutomaticBackupQueue = async () => {
  const state = await loadAutomaticBackupState();
  automaticBackupState = {
    ...state,
    pending: false,
    queuedAt: null,
    reason: null,
    sequence: state.sequence + 1,
  };
  await persistAutomaticBackupState();
  clearAutomaticBackupTimer();
};

export const requestAutomaticBackup = async (reason: string) => {
  const user = useAuthStore.getState().user;
  if (!user) {
    return;
  }

  if (!isFirebaseConfigured() && !isBackendConfigured()) {
    return;
  }

  const state = await loadAutomaticBackupState();
  automaticBackupState = {
    ...state,
    pending: true,
    queuedAt: Date.now(),
    reason,
    sequence: state.sequence + 1,
  };
  await persistAutomaticBackupState();
  scheduleAutomaticBackup();
};

export const flushAutomaticBackup = async ({ force = false }: { force?: boolean } = {}) => {
  if (automaticBackupInFlight) {
    return false;
  }

  const user = useAuthStore.getState().user;
  if (!user) {
    return false;
  }

  if (!isFirebaseConfigured() && !isBackendConfigured()) {
    return false;
  }

  const state = await loadAutomaticBackupState();
  if (!state.pending) {
    return false;
  }

  if (!force && state.lastBackupAt && Date.now() - state.lastBackupAt < AUTO_BACKUP_MIN_INTERVAL_MS) {
    scheduleAutomaticBackup();
    return false;
  }

  const sequenceAtStart = state.sequence;
  automaticBackupInFlight = true;

  try {
    await saveCloudBackup({ silent: true, preserveAutomaticBackupState: true });
  } catch (error) {
    if (__DEV__) {
      console.warn('[MoneyKai] automatic backup failed:', error);
    }
    return false;
  } finally {
    automaticBackupInFlight = false;
  }

  const latestState = await loadAutomaticBackupState();
  if (latestState.sequence === sequenceAtStart) {
    automaticBackupState = {
      ...latestState,
      pending: false,
      queuedAt: null,
      reason: null,
      lastBackupAt: Date.now(),
      sequence: latestState.sequence + 1,
    };
    await persistAutomaticBackupState();
  } else if (latestState.pending) {
    scheduleAutomaticBackup();
  }

  return true;
};

export const buildBackupSnapshot = (): MoneyKaiBackupSnapshot => {
  const user = normalizeUser();
  const budget = useBudgetStore.getState();
  const transactions = useTransactionStore.getState().transactions;
  const notes = useNotesStore.getState().notes;
  const groups = useGroupStore.getState().groups;
  const groupExpenses = useGroupStore.getState().expenses;
  const challenges = useChallengeStore.getState().challenges;
  const totalXP = useChallengeStore.getState().totalXP;
  const badges = useBadgeStore.getState().badges;
  const notifications = useNotificationStore.getState().notifications;
  const linkedAccounts = useLinkedAccountStore.getState().accounts;

  return {
    version: 1,
    capturedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      auth_provider: user.auth_provider,
    },
    settings: {
      app: {
        theme: useSettingsStore.getState().theme,
        themePalette: useSettingsStore.getState().themePalette,
        darkModeEnabled: useSettingsStore.getState().darkModeEnabled,
        currency: useSettingsStore.getState().currency,
        currencySymbol: useSettingsStore.getState().currencySymbol,
        notificationsEnabled: useSettingsStore.getState().notificationsEnabled,
        hapticEnabled: useSettingsStore.getState().hapticEnabled,
      },
      budget: {
        settings: budget.settings,
        adjustments: budget.adjustments,
        isEmergencyMode: budget.isEmergencyMode,
        resetHistory: budget.resetHistory,
      },
    },
    data: {
      transactions,
      notes,
      groups,
      groupExpenses,
      challenges,
      totalXP,
      badges,
      notifications,
      linkedAccounts,
    },
  };
};

export const saveCloudBackup = async (options: { silent?: boolean; preserveAutomaticBackupState?: boolean } = {}) => {
  const sequenceAtStart = (await loadAutomaticBackupState()).sequence;

  if (isBackendConfigured()) {
    const response = await backendApi.createBackup();
    const snapshot = response.item.snapshot;
    if (!options.silent) {
      await recordAppNotification({
        title: 'Backup saved',
        body: 'Your MoneyKai data was backed up to the cloud.',
        type: 'backup',
        schedule: false,
      });
    }
    if (!options.preserveAutomaticBackupState) {
      const latestState = await loadAutomaticBackupState();
      if (latestState.sequence === sequenceAtStart) {
        automaticBackupState = {
          ...latestState,
          pending: false,
          queuedAt: null,
          reason: null,
          lastBackupAt: Date.now(),
          sequence: latestState.sequence + 1,
        };
        await persistAutomaticBackupState();
        clearAutomaticBackupTimer();
      }
    }
    return snapshot;
  }

  if (!isFirebaseConfigured()) {
    throw new Error('Configure Firebase to enable cloud backup.');
  }

  const snapshot = buildBackupSnapshot();
  try {
    await addDoc(collection(firebaseDb, 'users', snapshot.profile.id, 'backups'), {
      backup_name: `Backup ${new Date().toLocaleString()}`,
      snapshot,
      createdAt: serverTimestamp(),
      createdAtMs: Date.now(),
    });
  } catch (error) {
    throw formatBackupError(error, 'save');
  }

  if (!options.silent) {
    await recordAppNotification({
      title: 'Backup saved',
      body: 'Your MoneyKai data was backed up to the cloud.',
      type: 'backup',
      schedule: false,
    });
  }

  if (!options.preserveAutomaticBackupState) {
    const latestState = await loadAutomaticBackupState();
    if (latestState.sequence === sequenceAtStart) {
      automaticBackupState = {
        ...latestState,
        pending: false,
        queuedAt: null,
        reason: null,
        lastBackupAt: Date.now(),
        sequence: latestState.sequence + 1,
      };
      await persistAutomaticBackupState();
      clearAutomaticBackupTimer();
    }
  }

  return snapshot;
};

export const getLatestCloudBackup = async () => {
  const user = normalizeUser();
  if (isBackendConfigured()) {
    const response = await backendApi.getLatestBackup();
    return response.item.snapshot;
  }

  if (!isFirebaseConfigured()) {
    throw new Error('Configure Firebase to restore cloud backups.');
  }

  const snapshotQuery = query(
    collection(firebaseDb, 'users', user.id, 'backups'),
    orderBy('createdAtMs', 'desc'),
    limit(1)
  );

  let latestBackup;
  try {
    const results = await getDocs(snapshotQuery);
    latestBackup = results.docs[0]?.data();
  } catch (error) {
    throw formatBackupError(error, 'restore');
  }

  if (!latestBackup?.snapshot) {
    throw new Error('No cloud backup exists yet.');
  }

  return latestBackup.snapshot as MoneyKaiBackupSnapshot;
};

export const restoreBackupSnapshot = (snapshot: MoneyKaiBackupSnapshot) => {
  const user = normalizeUser();
  if (snapshot.profile.id !== user.id) {
    throw new Error('This backup belongs to a different account.');
  }

  void clearAutomaticBackupQueue().catch(() => undefined);

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
    challenges: snapshot.data.challenges,
    totalXP: snapshot.data.totalXP,
  });

  useBadgeStore.setState({
    ...useBadgeStore.getState(),
    badges: snapshot.data.badges,
  });

  useNotificationStore.getState().replaceNotifications(snapshot.data.notifications ?? []);
  useLinkedAccountStore.getState().replaceAccounts(snapshot.data.linkedAccounts ?? []);
};

export const restoreLatestCloudBackup = async () => {
  if (isBackendConfigured()) {
    const response = await backendApi.restoreLatestBackup();
    restoreBackupSnapshot(response.item);

    await recordAppNotification({
      title: 'Backup restored',
      body: 'Your cloud backup was restored on this device.',
      type: 'backup',
      schedule: false,
    });

    return response.item;
  }

  const snapshot = await getLatestCloudBackup();
  restoreBackupSnapshot(snapshot);

  await recordAppNotification({
    title: 'Backup restored',
    body: 'Your cloud backup was restored on this device.',
    type: 'backup',
    schedule: false,
  });

  return snapshot;
};

