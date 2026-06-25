import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildBackupSnapshot, restoreBackupSnapshot, summarizeBackupSnapshot } from '@/services/backupService';

const mocks = vi.hoisted(() => ({
  authSetState: vi.fn(),
  user: {
    id: 'user-123',
    email: 'user@example.com',
    full_name: 'Money User',
    avatar_url: 'moneykai://avatar/user-123',
    auth_provider: 'email' as const,
    dob: '1990-04-18',
    gender: 'prefer_not_to_say' as const,
  },
  settingsState: {
    theme: 'light',
    currency: 'INR',
    currencySymbol: 'Rs',
    notificationsEnabled: true,
    hapticEnabled: true,
  },
  budgetState: {
    settings: { monthly_allowance: 10000, category_limits: {} },
    adjustments: [],
    isEmergencyMode: false,
    resetHistory: [],
  },
  transactions: [],
  notes: [],
  groups: [],
  groupExpenses: [],
  challenges: [],
  totalXP: 0,
  badges: [],
  notifications: [],
  linkedAccounts: [],
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({ user: mocks.user }),
    setState: mocks.authSetState,
  },
}));

vi.mock('@/stores/useSettingsStore', () => ({
  useSettingsStore: {
    getState: () => mocks.settingsState,
  },
}));

vi.mock('@/stores/useBudgetStore', () => ({
  useBudgetStore: {
    getState: () => mocks.budgetState,
    setState: vi.fn(),
  },
}));

vi.mock('@/stores/useTransactionStore', () => ({
  useTransactionStore: {
    getState: () => ({ transactions: mocks.transactions, setState: vi.fn() }),
    setState: vi.fn(),
  },
}));

vi.mock('@/stores/useNotesStore', () => ({
  useNotesStore: {
    getState: () => ({ notes: mocks.notes }),
    setState: vi.fn(),
  },
}));

vi.mock('@/stores/useGroupStore', () => ({
  useGroupStore: {
    getState: () => ({ groups: mocks.groups, expenses: mocks.groupExpenses }),
    setState: vi.fn(),
  },
}));

vi.mock('@/stores/useChallengeStore', () => ({
  useChallengeStore: {
    getState: () => ({ challenges: mocks.challenges, totalXP: mocks.totalXP }),
    setState: vi.fn(),
  },
}));

vi.mock('@/stores/useBadgeStore', () => ({
  useBadgeStore: {
    getState: () => ({ badges: mocks.badges }),
    setState: vi.fn(),
  },
}));

vi.mock('@/stores/useNotificationStore', () => ({
  useNotificationStore: {
    getState: () => ({
      notifications: mocks.notifications,
      replaceNotifications: vi.fn(),
    }),
  },
}));

vi.mock('@/stores/useLinkedAccountStore', () => ({
  useLinkedAccountStore: {
    getState: () => ({
      accounts: mocks.linkedAccounts,
      replaceAccounts: vi.fn(),
    }),
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('react-native', () => ({
  Dimensions: {
    get: vi.fn(() => ({ width: 390, height: 844 })),
  },
  NativeModules: {},
  Platform: {
    OS: 'android',
    select: vi.fn((options: Record<string, unknown>) => options.android ?? options.default),
  },
  StyleSheet: {
    create: vi.fn((styles) => styles),
  },
}));

vi.mock('@/services/firebase', () => ({
  firebaseDb: {},
  isFirebaseConfigured: () => false,
}));

vi.mock('@/services/firestoreService', () => ({
  getLatestUserBackup: vi.fn(),
  isFirebaseConfigured: () => false,
  saveUserBackup: vi.fn(),
}));

vi.mock('@/services/authService', () => ({
  getCurrentFirebaseUser: vi.fn(() => null),
}));

vi.mock('@/services/backendApi', () => ({
  backendApi: {},
  isBackendConfigured: () => false,
}));

vi.mock('@/services/networkClient', () => ({
  getNetworkStatus: vi.fn(async () => ({
    isOnline: true,
    isConnected: true,
    isInternetReachable: true,
  })),
}));

vi.mock('@/services/notificationService', () => ({
  recordAppNotification: vi.fn(),
}));

describe('backup privacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transactions.length = 0;
    mocks.notes.length = 0;
    mocks.groups.length = 0;
    mocks.groupExpenses.length = 0;
    mocks.challenges.length = 0;
    mocks.badges.length = 0;
    mocks.notifications.length = 0;
    mocks.linkedAccounts.length = 0;
  });

  it('preserves signed-in profile fields needed for restore validation', () => {
    const snapshot = buildBackupSnapshot();

    expect(snapshot.profile).toMatchObject({
      id: 'user-123',
      email: 'user@example.com',
      full_name: 'Money User',
      avatar_url: 'moneykai://avatar/user-123',
      auth_provider: 'email',
      dob: '1990-04-18',
      gender: 'prefer_not_to_say',
    });
  });

  it('does not include capture inbox, raw SMS settings, signals, drafts, or monitored account samples', () => {
    const snapshot = buildBackupSnapshot();
    const serialized = JSON.stringify(snapshot);

    expect(serialized).not.toContain('signals');
    expect(serialized).not.toContain('drafts');
    expect(serialized).not.toContain('monitoredAccounts');
    expect(serialized).not.toContain('rawPayload');
    expect(serialized).not.toContain('smsResearchModeEnabled');
  });

  it('summarizes latest-backup preview metadata without backup contents', () => {
    mocks.transactions.push(
      {
        id: 'income-1',
        amount: 5000,
        type: 'income',
        category: 'Salary',
        description: 'June salary',
        transaction_date: '2026-06-25',
      } as never,
      {
        id: 'expense-1',
        amount: 1250,
        type: 'expense',
        category: 'Food',
        description: 'Groceries',
        transaction_date: '2026-06-25',
      } as never,
    );
    mocks.notes.push({ id: 'note-1', title: 'Handoff note', body: 'Restore check' } as never);

    const metadata = summarizeBackupSnapshot(buildBackupSnapshot());

    expect(metadata).toMatchObject({
      accountName: 'Money User',
      accountEmail: 'user@example.com',
      transactionCount: 2,
      noteCount: 1,
      totalIncome: 5000,
      totalExpense: 1250,
      monthlyAllowance: 10000,
      version: 1,
    });
    expect(JSON.stringify(metadata)).not.toContain('Groceries');
    expect(JSON.stringify(metadata)).not.toContain('Restore check');
  });

  it('blocks restore when the latest backup belongs to another signed-in account', () => {
    const snapshot = buildBackupSnapshot();
    const otherAccountSnapshot = {
      ...snapshot,
      profile: {
        ...snapshot.profile,
        id: 'other-user',
        email: 'other@example.com',
      },
    };

    expect(() => restoreBackupSnapshot(otherAccountSnapshot)).toThrow('This backup belongs to a different account.');
    expect(mocks.authSetState).not.toHaveBeenCalled();
  });
});
