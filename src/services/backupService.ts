import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useBadgeStore } from '@/stores/useBadgeStore';
import { recordAppNotification } from './notificationService';
import type { BudgetAdjustment, BudgetSettings } from '@/types/budget';
import type { Transaction } from '@/types/transaction';
import type { Note } from '@/types/note';
import type { Group, GroupExpense } from '@/types/group';
import type { Challenge } from '@/types/challenge';
import type { Badge } from '@/types/badge';
import type { ThemeMode } from '@/constants/theme';
import { firebaseDb, isFirebaseConfigured } from './firebase';

interface BackupAppSettings {
  theme: ThemeMode;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
}

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
    },
  };
};

export const saveCloudBackup = async () => {
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

  await recordAppNotification({
    title: 'Backup saved',
    body: 'Your MoneyKai data was backed up to the cloud.',
    type: 'backup',
    schedule: false,
  });

  return snapshot;
};

export const getLatestCloudBackup = async () => {
  const user = normalizeUser();
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

  useSettingsStore.setState({
    theme: snapshot.settings.app.theme,
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
};

export const restoreLatestCloudBackup = async () => {
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

