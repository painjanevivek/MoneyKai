import { backendApi, isBackendConfigured } from './backendApi';
import { useAuthStore } from '@/stores/useAuthStore';

/** Keep the local workspace until the server certifies this exact deletion. */
export async function deleteConfirmedAccount(ownerId: string, confirmation: string, idempotencyKey: string) {
  const session = useAuthStore.getState();
  if (confirmation !== 'DELETE') throw new Error('Type DELETE to confirm permanent deletion.');
  if (!ownerId || !session.isAuthenticated || session.isHydratingSession || session.user?.id !== ownerId) {
    throw new Error('Your session changed. Sign in again and review the account before deleting.');
  }
  if (!isBackendConfigured()) throw new Error('Online deletion is unavailable. Use the support request below.');
  const result = await backendApi.deleteAccount(idempotencyKey, ownerId);
  if (!result.deleted || result.operation.status !== 'completed' ||
      result.operation.operationType !== 'account_deletion' || !result.certificate?.zeroResidue ||
      result.certificate.operationId !== result.operation.operationId) {
    throw new Error(result.operation.recoveryAction ??
      `Deletion is not confirmed (${result.operation.status}). Your local session has not been cleared. Retry or contact support.`);
  }
  // Never sign out or erase a different account opened while the request was pending.
  const localSessionCleared = useAuthStore.getState().user?.id === ownerId;
  if (localSessionCleared) {
    await useAuthStore.getState().signOut({ skipFinalBackup: true });
  }
  return { certificate: result.certificate, localSessionCleared };
}
