import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DraftTransaction } from '@/types/capture';

const mocks = vi.hoisted(() => ({ upsert: vi.fn(async () => undefined) }));
vi.mock('react-native', () => ({ NativeModules: {} }));
vi.mock('@/services/privateDeviceStorage', () => ({ privateDeviceStorage: {
  getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined,
} }));
vi.mock('@/services/notificationService', () => ({ recordAppNotification: vi.fn(async () => undefined) }));
vi.mock('./useSettingsStore', () => ({ useSettingsStore: { getState: () => ({ currencySymbol: '₹' }) } }));
vi.mock('@/services/nativeCaptureBridge', () => ({ setNativeApprovedSmsAccounts: vi.fn() }));
vi.mock('./useConnectStore', () => ({ useConnectStore: { getState: () => ({ notificationAppsByUser: {} }) } }));
vi.mock('./useBudgetStore', () => ({ useBudgetStore: { getState: () => ({ settings: { monthly_allowance: 10000 } }) } }));
vi.mock('./useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: 'owner' } }) } }));
vi.mock('@/services/firestoreData', () => ({ upsertUserDoc: mocks.upsert, deleteUserDoc: vi.fn() }));
vi.mock('@/services/backupService', () => ({ requestAutomaticBackup: vi.fn(async () => undefined) }));
vi.mock('@/services/firebase', () => ({ isFirebaseConfigured: () => true }));
import { useCaptureStore } from './useCaptureStore';
import { useTransactionStore } from './useTransactionStore';

const draft = (id: string, changes: Partial<DraftTransaction> = {}): DraftTransaction => ({
  id, signalId: id, user_id: 'owner', type: 'expense', amount: 150, description: 'Synthetic cafe',
  payment_method: 'upi', transaction_date: '2026-09-30', captureSource: 'sms',
  confidence: 0.7, status: 'pending', createdAt: '2026-09-30T10:00:00Z', ...changes,
});

describe('Allow All with the real capture and transaction stores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCaptureStore.setState({ drafts: [], signals: [], merchantRules: [] });
    useTransactionStore.setState({ transactions: [], isSeeded: true });
  });
  it('adds local SMS/notification transactions once, moves successful drafts to Reviewed and never uploads them', () => {
    const rows = [draft('sms', { canonicalTransactionKey: 'reference-one', suggestedCategory: 'food' }),
      draft('same-payment', { canonicalTransactionKey: 'reference-one', captureSource: 'notification' }),
      draft('credit', { type: 'income', amount: 300, captureSource: 'notification', description: 'Synthetic sender' })];
    useCaptureStore.setState({ drafts: rows });
    expect(useCaptureStore.getState().confirmAllDrafts('owner', rows.map(row => row.id))).toEqual({ added: 2, pending: 1, interrupted: false });
    expect(useTransactionStore.getState().transactions).toHaveLength(2);
    expect(useTransactionStore.getState().transactions.map(row => row.category)).toEqual(['other_income', 'food']);
    expect(useCaptureStore.getState().drafts.map(row => row.status)).toEqual(['confirmed', 'pending', 'confirmed']);
    expect(useCaptureStore.getState().merchantRules).toEqual([]);
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(useCaptureStore.getState().confirmAllDrafts('owner', rows.map(row => row.id))).toEqual({ added: 0, pending: 1, interrupted: false });
    expect(useTransactionStore.getState().transactions).toHaveLength(2);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
