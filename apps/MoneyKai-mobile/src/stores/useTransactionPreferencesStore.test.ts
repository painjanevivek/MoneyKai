import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transaction } from '@/types/transaction';
const mock = vi.hoisted(() => ({ owner: 'owner', writes: vi.fn(async () => undefined) }));
vi.mock('@/services/privateDeviceStorage', () => ({ privateDeviceStorage: { getItem: async () => null, setItem: mock.writes, removeItem: async () => undefined } }));
vi.mock('./useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: mock.owner } }) } }));
import { useTransactionPreferencesStore } from './useTransactionPreferencesStore';
import { counterpartyAliasKey, normalizedPhone, phoneDigits } from '@/utils/transactionPreferences';
const transaction: Transaction = { id: 'one', user_id: 'owner', type: 'expense', amount: 150, category: 'others', description: 'Akshay Naresh Painj', counterpartyName: 'Akshay Naresh Painj', payment_method: 'upi', transaction_date: '2026-09-30', created_at: '2026-09-30T10:00:00Z' };
describe('private transaction preferences', () => {
  beforeEach(() => { mock.owner = 'owner'; useTransactionPreferencesStore.setState({ aliases: {}, archived: {}, phones: {} }); });
  it('applies a nickname to an exact full saved counterparty key, never changes source or guesses prefixes', () => {
    expect(useTransactionPreferencesStore.getState().setAlias(transaction, 'Akshay')).toBe(true);
    expect(useTransactionPreferencesStore.getState().aliases.owner[counterpartyAliasKey({ ...transaction, id: 'later' })]).toBe('Akshay');
    expect(useTransactionPreferencesStore.getState().aliases.owner[counterpartyAliasKey({ description: 'Akshay Naresh Painjane' })]).toBeUndefined();
    expect(transaction.description).toBe('Akshay Naresh Painj');
    expect(useTransactionPreferencesStore.getState().setAlias(transaction, '')).toBe(true);
    expect(useTransactionPreferencesStore.getState().aliases.owner).toEqual({});
  });
  it('archives and restores without modifying or removing ledger amounts', () => {
    expect(useTransactionPreferencesStore.getState().setArchived(transaction, true)).toBe(true);
    expect(useTransactionPreferencesStore.getState().archived.owner.one).toBe(true);
    expect(transaction.amount).toBe(150);
    useTransactionPreferencesStore.getState().setArchived(transaction, false);
    expect(useTransactionPreferencesStore.getState().archived.owner.one).toBe(false);
  });
  it('isolates all writes by owner and clears only the current owner after deletion', () => {
    mock.owner = 'other';
    expect(useTransactionPreferencesStore.getState().setAlias(transaction, 'Someone')).toBe(false);
    expect(useTransactionPreferencesStore.getState().setArchived(transaction, true)).toBe(false);
    expect(useTransactionPreferencesStore.getState().setPhone('owner', '+91', '9876543210')).toBe(false);
    mock.owner = 'owner'; useTransactionPreferencesStore.getState().setPhone('owner', '+91', '9876543210');
    useTransactionPreferencesStore.setState({ phones: { ...useTransactionPreferencesStore.getState().phones, other: { countryCode: '+1', nationalNumber: '2025550123' } } });
    useTransactionPreferencesStore.getState().clearOwner('owner');
    expect(useTransactionPreferencesStore.getState().phones.owner).toBeUndefined(); expect(useTransactionPreferencesStore.getState().phones.other).toBeDefined();
  });
  it('sanitizes digits and validates Indian mobiles and international E.164 length without claiming OTP verification', () => {
    expect(phoneDigits('98 765-43210')).toBe('9876543210');
    expect(normalizedPhone('+91', '98 765-43210')).toBe('+919876543210');
    expect(normalizedPhone('+1', '2025550123')).toBe('+12025550123');
    expect(normalizedPhone('+91', '1234567890')).toBeUndefined();
    expect(normalizedPhone('+0', '2025550123')).toBeUndefined();
    expect(normalizedPhone('+123', '12345678901234')).toBeUndefined();
    expect(useTransactionPreferencesStore.getState().setPhone('owner', '+91', '123')).toBe(false);
  });
  it('persists only private preferences through the encrypted storage adapter', () => {
    const snapshot = useTransactionPreferencesStore.persist.getOptions().partialize!(useTransactionPreferencesStore.getState());
    expect(Object.keys(snapshot).sort()).toEqual(['aliases', 'archived', 'phones']);
  });
});
