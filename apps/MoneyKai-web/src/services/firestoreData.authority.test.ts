import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deleteUserDoc,
  deleteUserGroup,
  deleteUserGroupExpense,
  loadUserFirestoreSnapshot,
  saveUserAppSettings,
  saveUserBudgetSettings,
  upsertUserDoc,
  upsertUserGroup,
  upsertUserGroupExpense,
} from './firestoreData';

const backendApiMock = vi.hoisted(() => ({
  getBootstrap: vi.fn(),
  updateAppSettings: vi.fn(),
  updateBudgetSettings: vi.fn(),
  updateResource: vi.fn(),
  deleteResource: vi.fn(),
  updateChallenge: vi.fn(),
  deleteChallenge: vi.fn(),
  updateLinkedAccount: vi.fn(),
  deleteLinkedAccount: vi.fn(),
  createGroup: vi.fn(),
  deleteGroup: vi.fn(),
  createGroupExpense: vi.fn(),
  deleteGroupExpense: vi.fn(),
}));

vi.mock('./backendApi', () => ({ backendApi: backendApiMock }));
vi.mock('./firebase', () => ({ firebaseDb: {}, isFirebaseConfigured: () => true }));
vi.mock('../constants/theme', () => ({
  DEFAULT_THEME_PALETTE: 'sage',
  getThemeModeForPalette: () => 'dark',
}));

describe('web canonical write authority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes settings and user-resource writes through authenticated backend contracts', async () => {
    await saveUserAppSettings('user-1', { currency: 'INR' });
    await saveUserBudgetSettings('user-1', { isEmergencyMode: true });
    await upsertUserDoc('transactions', 'user-1', { id: 'tx-1', amount: 42 });
    await deleteUserDoc('transactions', 'user-1', 'tx-1');

    expect(backendApiMock.updateAppSettings).toHaveBeenCalledWith({ currency: 'INR' });
    expect(backendApiMock.updateBudgetSettings).toHaveBeenCalledWith({ isEmergencyMode: true });
    expect(backendApiMock.updateResource).toHaveBeenCalledWith('transactions', 'tx-1', {
      id: 'tx-1',
      amount: 42,
    });
    expect(backendApiMock.deleteResource).toHaveBeenCalledWith('transactions', 'tx-1');
  });

  it('loads the initial workspace through the bounded backend bootstrap', async () => {
    const snapshot = {
      version: 1,
      capturedAt: '2026-08-24T00:00:00Z',
      profile: { id: 'user-1', email: 'owner@example.com', full_name: 'Owner' },
      settings: { app: {}, budget: {} },
      data: {
        transactions: [],
        notes: [],
        groups: [],
        groupExpenses: [],
        challenges: [],
        totalXP: 0,
        badges: [],
        notifications: [],
      },
    };
    backendApiMock.getBootstrap.mockResolvedValue(snapshot);

    const result = await loadUserFirestoreSnapshot('user-1', snapshot.profile as never);

    expect(result).toBe(snapshot);
    expect(backendApiMock.getBootstrap).toHaveBeenCalledTimes(1);
  });

  it('routes challenge, linked-account, group, and expense writes through typed backend paths', async () => {
    const challenge = { id: 'challenge-1', title: 'Emergency fund' };
    const linkedAccount = { id: 'account-1', displayName: 'Cash' };
    const group = { id: 'group-1', name: 'Trip' };
    const expense = { id: 'expense-1', groupId: 'group-1', amount: 125 };

    await upsertUserDoc('savings', 'user-1', challenge);
    await deleteUserDoc('savings', 'user-1', challenge.id);
    await upsertUserDoc('linkedAccounts', 'user-1', linkedAccount);
    await deleteUserDoc('linkedAccounts', 'user-1', linkedAccount.id);
    await upsertUserGroup('user-1', group as never);
    await deleteUserGroup('user-1', group.id);
    await upsertUserGroupExpense('user-1', group.id, expense as never);
    await deleteUserGroupExpense('user-1', group.id, expense.id);

    expect(backendApiMock.updateChallenge).toHaveBeenCalledWith(challenge.id, challenge);
    expect(backendApiMock.deleteChallenge).toHaveBeenCalledWith(challenge.id);
    expect(backendApiMock.updateLinkedAccount).toHaveBeenCalledWith(linkedAccount.id, linkedAccount);
    expect(backendApiMock.deleteLinkedAccount).toHaveBeenCalledWith(linkedAccount.id);
    expect(backendApiMock.createGroup).toHaveBeenCalledWith(group);
    expect(backendApiMock.deleteGroup).toHaveBeenCalledWith(group.id);
    expect(backendApiMock.createGroupExpense).toHaveBeenCalledWith(group.id, expense);
    expect(backendApiMock.deleteGroupExpense).toHaveBeenCalledWith(group.id, expense.id);
  });

  it('fails closed for collections without an ownership contract', async () => {
    await expect(upsertUserDoc('unknown', 'user-1', { id: 'item-1' })).rejects.toThrow(
      'Unsupported backend-owned collection',
    );
  });
});
