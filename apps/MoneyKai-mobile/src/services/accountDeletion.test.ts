import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ deleteAccount: vi.fn(), clearOwner: vi.fn() }));
vi.mock('./backendApi', () => ({ backendApi: { deleteAccount: mock.deleteAccount } }));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: 'owner' } }) } }));
vi.mock('@/stores/useTransactionPreferencesStore', () => ({ useTransactionPreferencesStore: { getState: () => ({ clearOwner: mock.clearOwner }) } }));

import { deleteMoneyKaiAccount } from './accountDeletion';

describe('account deletion handoff', () => {
  beforeEach(() => { mock.deleteAccount.mockReset(); mock.clearOwner.mockReset(); });

  it('signs out only after a completed, zero-residue deletion', async () => {
    const signOut = vi.fn(async () => undefined);
    mock.deleteAccount.mockResolvedValue({ deleted: true, operation: { status: 'completed' }, certificate: { zeroResidue: true } });

    await deleteMoneyKaiAccount('delete-123', signOut);

    expect(mock.deleteAccount).toHaveBeenCalledWith('delete-123');
    expect(signOut).toHaveBeenCalledOnce();
    expect(mock.clearOwner).toHaveBeenCalledWith('owner');
  });

  it('keeps the session when deletion is incomplete', async () => {
    const signOut = vi.fn(async () => undefined);
    mock.deleteAccount.mockResolvedValue({ deleted: false, operation: { status: 'retryable', recoveryAction: 'Retry this request.' }, certificate: null });

    await expect(deleteMoneyKaiAccount('delete-123', signOut)).rejects.toThrow('Retry this request.');
    expect(signOut).not.toHaveBeenCalled();
    expect(mock.clearOwner).not.toHaveBeenCalled();
  });

  it('keeps the session when the deletion certificate reports residue', async () => {
    const signOut = vi.fn(async () => undefined);
    mock.deleteAccount.mockResolvedValue({ deleted: true, operation: { status: 'completed' }, certificate: { zeroResidue: false } });

    await expect(deleteMoneyKaiAccount('delete-123', signOut)).rejects.toThrow();
    expect(signOut).not.toHaveBeenCalled();
  });
});
