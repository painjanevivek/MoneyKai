import { describe, expect, it, vi } from 'vitest';
import { buildBackupSnapshot } from '@/services/backupService';

const mocks = vi.hoisted(() => ({
  user: {
    id: 'user-123',
    email: 'user@example.com',
    full_name: 'Money User',
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
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({ user: mocks.user }),
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

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('@/services/firebase', () => ({
  firebaseDb: {},
  isFirebaseConfigured: () => false,
}));

vi.mock('@/services/backendApi', () => ({
  backendApi: {},
  isBackendConfigured: () => false,
}));

vi.mock('@/services/notificationService', () => ({
  recordAppNotification: vi.fn(),
}));

describe('backup privacy', () => {
  it('does not include capture inbox, raw SMS settings, signals, drafts, or monitored account samples', () => {
    const snapshot = buildBackupSnapshot();
    const serialized = JSON.stringify(snapshot);

    expect(serialized).not.toContain('signals');
    expect(serialized).not.toContain('drafts');
    expect(serialized).not.toContain('monitoredAccounts');
    expect(serialized).not.toContain('rawPayload');
    expect(serialized).not.toContain('smsResearchModeEnabled');
  });
});
