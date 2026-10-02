import type { ApprovedTransactionBatch, BatchReceipt, DeletionReceipt, SyncConsent } from '@moneykai/domain/transactionImports';
import { SMS_SYNC_CONSENT_VERSION } from '@moneykai/domain/transactionImports';
import { APPROVED_SMS_CLOUD_ENABLED } from '@/config/largeSmsFeatures';
import { useAuthStore } from '@/stores/useAuthStore';
import { ledgerRequest } from './localLedger';
import { approvedSmsRequest, SmsCloudPause } from './approvedSmsSyncApi';
import { captureRemoteSyncSession, isRemoteSyncSessionCurrent } from '@moneykai/domain/syncSession';

type LocalConsent = SyncConsent & { remotePending?: boolean; desiredEnabled?: boolean; backfillCursor?: string; backfillComplete?: boolean };
type FrozenBatch = { id: string; kind:'upload'|'delete'; jobId:string; payload: ApprovedTransactionBatch };
export type SmsSyncStatus = { paused?: string; retryAt?: number; awaitingSync?:number; synced?:number; conflicts?:number; pendingDeletions?:number };
const flights = new Map<string, Promise<SmsSyncStatus>>();
const current = (owner:string) => useAuthStore.getState().user?.id === owner;
const queue = <T>(owner:string, action:string, extra:Record<string,unknown> = {}) => ledgerRequest<T>(owner,{op:'cloud',action,...extra});
export const readSmsCloudConsent = (owner:string) => queue<LocalConsent>(owner,'consent');
export async function setSmsCloudConsent(owner:string, enabled:boolean): Promise<LocalConsent> {
  const session=captureRemoteSyncSession(owner);
  const active=() => isRemoteSyncSessionCurrent(session,useAuthStore.getState().user?.id);
  const previous = await readSmsCloudConsent(owner);
  // Stop immediately, including a previously frozen batch, before any network work.
  const pending = { ...previous, enabled:false, desiredEnabled:enabled, remotePending:true };
  await queue(owner,'setConsent',{consent:pending});
  if(!APPROVED_SMS_CLOUD_ENABLED || !active()) return pending;
  try {
    const remote = await approvedSmsRequest<SyncConsent>(owner,'/v1/capture/sync-consent');
    const updated = remote.enabled === enabled ? remote : await approvedSmsRequest<SyncConsent>(owner,'/v1/capture/sync-consent', {enabled,version:SMS_SYNC_CONSENT_VERSION,expectedRevision:remote.revision},'PUT');
    if(!active()) throw new Error('Cloud owner changed');
    const consent = {...updated, desiredEnabled:enabled,remotePending:false,backfillCursor:'',backfillComplete:false};
    await queue(owner,'setConsent',{consent});
    return consent;
  } catch { return pending; }
}
export async function syncApprovedSmsOnce(owner:string): Promise<SmsSyncStatus> {
  if(!APPROVED_SMS_CLOUD_ENABLED || !current(owner)) return {paused:'disabled_unverified'};
  const existing = flights.get(owner); if(existing) return existing;
  const session=captureRemoteSyncSession(owner);
  const active=() => isRemoteSyncSessionCurrent(session,useAuthStore.getState().user?.id);
  const promise = (async () => {
    let claimed:FrozenBatch|undefined;
    try {
      const consent = await readSmsCloudConsent(owner);
      if(consent.remotePending) {
        const updated = await setSmsCloudConsent(owner,Boolean(consent.desiredEnabled));
        if(updated.remotePending) return {paused:'consent_confirmation_pending'};
      }
      const next = await queue<FrozenBatch & SmsSyncStatus>(owner,'claim');
      if(next.paused) return {...next,...await queue<SmsSyncStatus>(owner,'stats')};
      claimed = next;
      if(!active()) return {paused:'owner_changed'};
      let receipt:BatchReceipt|DeletionReceipt;
      if(next.kind === 'delete') receipt = await approvedSmsRequest<DeletionReceipt>(owner,'/v1/capture/approved-transactions/delete',next.payload);
      else {
        await approvedSmsRequest(owner,'/v1/transaction-imports',{clientJobId:next.jobId,parserVersion:'sms-offline-v1',consentRevision:next.payload.consentRevision});
        // Recheck the persisted consent immediately before sending the frozen DTO.
        const latest = await readSmsCloudConsent(owner);
        if(!latest.enabled || latest.revision !== next.payload.consentRevision || !active()) return {paused:'consent_changed'};
        receipt = await approvedSmsRequest<BatchReceipt>(owner,`/v1/transaction-imports/${next.jobId}/batches`,next.payload);
      }
      if(!active()) return {paused:'owner_changed'};
      await queue(owner,'ack',{id:next.id,receipt});
      return await queue<SmsSyncStatus>(owner,'stats');
    } catch(error) {
      const availability = error instanceof SmsCloudPause ? error.availability : undefined;
      const paused = availability?.status ?? 'temporary_failure';
      const retryAt = availability?.retryAt ? Date.parse(availability.retryAt) : 0;
      if(claimed && active()) await queue(owner,'defer',{id:claimed.id,reason:paused,retryAt}).catch(()=>undefined);
      return {paused,retryAt};
    }
  })();
  flights.set(owner,promise);
  try { return await promise; } finally { flights.delete(owner); }
}
