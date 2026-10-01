import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteConfirmedAccount } from './accountDeletion';

const mocks = vi.hoisted(() => ({
  deleteAccount: vi.fn(), signOut: vi.fn(), configured: true,
  owner: 'owner', authenticated: true, hydrating: false,
}));
vi.mock('./backendApi', () => ({ backendApi: { deleteAccount: mocks.deleteAccount }, isBackendConfigured: () => mocks.configured }));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: { getState: () => ({
  user: mocks.owner ? { id: mocks.owner } : null, isAuthenticated: mocks.authenticated,
  isHydratingSession: mocks.hydrating, signOut: mocks.signOut,
}) } }));
const verified = () => ({ deleted: true, operation: { operationId: 'operation-1', operationType: 'account_deletion', status: 'completed' }, certificate: { operationId: 'operation-1', zeroResidue: true } });
describe('confirmed account deletion safeguards', () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.owner = 'owner'; mocks.authenticated = true; mocks.hydrating = false; mocks.configured = true;
    mocks.deleteAccount.mockResolvedValue(verified()); mocks.signOut.mockResolvedValue(undefined);
  });
  it('uses the owner-bound endpoint and skips a final backup only after certification', async () => {
    await expect(deleteConfirmedAccount('owner', 'DELETE', 'stable-key')).resolves.toMatchObject({ localSessionCleared: true });
    expect(mocks.deleteAccount).toHaveBeenCalledWith('stable-key', 'owner');
    expect(mocks.signOut).toHaveBeenCalledWith({ skipFinalBackup: true });
    expect(mocks.signOut.mock.invocationCallOrder[0]).toBeGreaterThan(mocks.deleteAccount.mock.invocationCallOrder[0]);
  });
  it.each(['', 'delete', 'DELETE '])('rejects unconfirmed input %j without making a request', async text => {
    await expect(deleteConfirmedAccount('owner', text, 'key')).rejects.toThrow('Type DELETE');
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });
  it.each(['signed-out', 'changed-owner', 'hydrating', 'unconfigured'])('rejects %s before making a request', async reason => {
    if (reason === 'signed-out') mocks.authenticated = false;
    if (reason === 'changed-owner') mocks.owner = 'other';
    if (reason === 'hydrating') mocks.hydrating = true;
    if (reason === 'unconfigured') mocks.configured = false;
    await expect(deleteConfirmedAccount('owner', 'DELETE', 'key')).rejects.toThrow();
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });
  it.each(['not-deleted', 'retryable', 'wrong-operation', 'missing-certificate', 'residue', 'wrong-certificate'])('preserves the session for %s', async reason => {
    const result = verified();
    if (reason === 'not-deleted') result.deleted = false;
    if (reason === 'retryable') result.operation.status = 'retryable';
    if (reason === 'wrong-operation') result.operation.operationType = 'restore';
    if (reason === 'missing-certificate') Object.assign(result, { certificate: null });
    if (reason === 'residue') result.certificate.zeroResidue = false;
    if (reason === 'wrong-certificate') result.certificate.operationId = 'unrelated';
    mocks.deleteAccount.mockResolvedValue(result);
    await expect(deleteConfirmedAccount('owner', 'DELETE', 'key')).rejects.toThrow('not confirmed');
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it('preserves a new owner opened while the request is pending', async () => {
    mocks.deleteAccount.mockImplementation(async () => { mocks.owner = 'other'; return verified(); });
    await expect(deleteConfirmedAccount('owner', 'DELETE', 'key')).resolves.toMatchObject({ localSessionCleared: false });
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it('preserves the local session on network failure', async () => {
    mocks.deleteAccount.mockRejectedValue(new Error('Network unavailable'));
    await expect(deleteConfirmedAccount('owner', 'DELETE', 'key')).rejects.toThrow('Network unavailable');
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
