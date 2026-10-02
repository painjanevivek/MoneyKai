import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ upsert: vi.fn(async () => undefined), remove: vi.fn(async () => undefined) }));
vi.mock('@/services/privateDeviceStorage', () => ({ privateDeviceStorage: {
  getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined,
} }));
vi.mock('@/services/notificationService', () => ({ recordAppNotification: vi.fn(async () => undefined) }));
vi.mock('./useBudgetStore', () => ({ useBudgetStore: { getState: () => ({ settings: { monthly_allowance: 10000 } }) } }));
vi.mock('./useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: 'local-test-user' } }) } }));
vi.mock('./useSettingsStore', () => ({ useSettingsStore: { getState: () => ({ currencySymbol: '₹' }) } }));
vi.mock('@/services/firestoreData', () => ({ upsertUserDoc: mocks.upsert, deleteUserDoc: mocks.remove }));
vi.mock('@/services/backupService', () => ({ requestAutomaticBackup: vi.fn(async () => undefined) }));
vi.mock('@/services/firebase', () => ({ isFirebaseConfigured: () => true }));
import { useTransactionStore } from './useTransactionStore';
import type { Transaction } from '@/types/transaction';
import { recordAppNotification } from '@/services/notificationService';

const input = { user_id: 'local-test-user', type: 'expense' as const, amount: 100,
  category: 'shopping', description: 'Purchase', payment_method: 'bank', transaction_date: '2026-09-30',
  captureSource: 'sms' as const };
describe.each(['sms', 'notification'] as const)('%s-derived ledger privacy', (captureSource) => {
  beforeEach(() => { vi.clearAllMocks(); useTransactionStore.setState({ transactions: [], isSeeded: true }); });
  it('confirms SMS locally without uploading the ledger row', () => {
    const captured = { ...input, captureSource, sourceFingerprint: 'same-captured-source' };
    expect(useTransactionStore.getState().addTransaction(captured)).toBe(true);
    expect(useTransactionStore.getState().transactions).toHaveLength(1);
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(recordAppNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Transaction added', body: 'Purchase · Debit ₹100.00', localOnly: true, systemOnly: true }));
    expect(useTransactionStore.getState().addTransaction(captured)).toBe(false);
    expect(vi.mocked(recordAppNotification).mock.calls.filter(([item]) => item.title === 'Transaction added')).toHaveLength(1);
  });
  it('keeps budget notifications local when their totals include SMS transactions', () => {
    useTransactionStore.getState().addTransaction({ ...input, captureSource, amount: 8000, automaticallyRecorded: true });
    expect(recordAppNotification).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Spending alert', localOnly: true }));
    useTransactionStore.getState().addTransaction({ ...input, amount: 2000, captureSource: 'manual' });
    expect(recordAppNotification).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Budget exhausted', localOnly: true }));
  });
  it('keeps SMS provenance on edit and does not upload the update', () => {
    useTransactionStore.getState().addTransaction({ ...input, captureSource });
    const id = useTransactionStore.getState().transactions[0].id;
    useTransactionStore.getState().updateTransaction(id, { amount: 200, captureSource: 'manual' as Transaction['captureSource'] });
    expect(useTransactionStore.getState().transactions[0].captureSource).toBe(captureSource);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it('deletes SMS locally without sending its identifier to Firestore', () => {
    useTransactionStore.getState().addTransaction({ ...input, captureSource });
    useTransactionStore.getState().deleteTransaction(useTransactionStore.getState().transactions[0].id);
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(useTransactionStore.getState().transactions).toEqual([]);
  });
});
