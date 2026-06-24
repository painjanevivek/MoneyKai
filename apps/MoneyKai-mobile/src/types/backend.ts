import type { BudgetAdjustment, BudgetSettings } from './budget';
import type { Transaction } from './transaction';
import type { Note } from './note';
import type { Group, GroupExpense } from './group';
import type { Challenge } from './challenge';
import type { Badge } from './badge';
import type { AppNotification } from './notification';
import type { ThemeMode, ThemePaletteId } from '@/constants/theme';
import type { LinkedAccount } from '@moneykai/domain';

export interface BackendAppSettings {
  theme: ThemeMode;
  themePalette?: ThemePaletteId;
  darkModeEnabled?: boolean;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  tourCompleted?: boolean;
}

export interface BackendSnapshot {
  version: 1;
  capturedAt: string;
  profile: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    auth_provider?: 'email' | 'google';
    dob?: string;
    gender?: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'self_describe';
  };
  settings: {
    app: BackendAppSettings;
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
    backups?: unknown[];
  };
  summary?: {
    totalSpent: number;
    totalIncome: number;
    transactionCount: number;
    challengeCount: number;
    groupCount: number;
  };
}

export interface BackendBackupRecord {
  id?: string;
  backup_name: string;
  snapshot: BackendSnapshot;
  createdAt: string;
  createdAtMs: number;
}
