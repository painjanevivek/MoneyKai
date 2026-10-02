import { backendApi } from './backendApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionPreferencesStore } from '@/stores/useTransactionPreferencesStore';

/** Keep the local session until the backend confirms every account-data store is empty. */
export async function deleteMoneyKaiAccount(
  idempotencyKey: string,
  signOut: () => Promise<void>,
): Promise<void> {
  const owner = useAuthStore.getState().user?.id;
  const result = await backendApi.deleteAccount(idempotencyKey);
  if (!result.deleted || result.operation.status !== 'completed' || !result.certificate?.zeroResidue) {
    throw new Error(
      result.operation.recoveryAction ||
      `Deletion is ${result.operation.status}. Your account remains signed in; please retry or contact support.`,
    );
  }
  if (owner) useTransactionPreferencesStore.getState().clearOwner(owner);
  await signOut();
}
