import { isSupabaseConfigured, supabase } from './supabase';
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

interface BackupAppSettings {
  theme: ThemeMode;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
}

export interface SmartPaisaBackupSnapshot {
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

export const buildBackupSnapshot = (): SmartPaisaBackupSnapshot => {
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
  if (!isSupabaseConfigured()) {
    throw new Error('Configure Supabase to enable cloud backup.');
  }

  const snapshot = buildBackupSnapshot();
  const { error } = await supabase.from('user_backups').insert({
    user_id: snapshot.profile.id,
    backup_name: `Backup ${new Date().toLocaleString()}`,
    snapshot,
  });

  if (error) throw new Error(error.message);

  await recordAppNotification({
    title: 'Backup saved',
    body: 'Your SmartPaisa data was backed up to the cloud.',
    type: 'backup',
    schedule: false,
  });

  return snapshot;
};

export const getLatestCloudBackup = async () => {
  const user = normalizeUser();
  if (!isSupabaseConfigured()) {
    throw new Error('Configure Supabase to restore cloud backups.');
  }

  const { data, error } = await supabase
    .from('user_backups')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.snapshot) {
    throw new Error('No cloud backup exists yet.');
  }

  return data.snapshot as SmartPaisaBackupSnapshot;
};

export const restoreBackupSnapshot = (snapshot: SmartPaisaBackupSnapshot) => {
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
