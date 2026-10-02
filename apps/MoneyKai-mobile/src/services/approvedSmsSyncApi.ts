import { getBackendBaseUrl } from '@/config/environment';
import { getCurrentFirebaseIdToken, getCurrentFirebaseUser } from './authService';
import { fetchWithRetry } from './networkClient';
import { assertCloudRouteAllowed } from './smsDeviceOnlyPolicy';
import type { SyncAvailability } from '@moneykai/domain/transactionImports';
import { captureRemoteSyncSession, isRemoteSyncSessionCurrent } from '@moneykai/domain/syncSession';

export class SmsCloudPause extends Error {
  constructor(public status: number, public availability?: SyncAvailability) { super(availability?.reason ?? 'Approved transaction synchronization paused'); }
}
/** No cache for consent or receipts; queue owns retry and authentication generation. */
export async function approvedSmsRequest<T>(owner: string, path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  const session=captureRemoteSyncSession(owner);
  const active=() => isRemoteSyncSessionCurrent(session,getCurrentFirebaseUser()?.uid);
  const serialized = body === undefined ? undefined : JSON.stringify(body);
  assertCloudRouteAllowed(path, serialized);
  if(!active()) throw new Error('Cloud owner changed');
  const token = await getCurrentFirebaseIdToken();
  if(!active()) throw new Error('Cloud owner changed');
  const base = getBackendBaseUrl();
  if(!base) throw new Error('Backend unavailable');
  const response = await fetchWithRetry(base + path, { method, body: serialized, headers: { Authorization: `Bearer ${token}`, 'Content-Type':'application/json' } }, { retries:0, timeoutMs:20000 });
  if(!active()) throw new Error('Cloud owner changed');
  const payload = await response.json();
  if(!response.ok) throw new SmsCloudPause(response.status, payload.detail?.status ? payload.detail : payload.error?.details?.status ? payload.error.details : undefined);
  return payload as T;
}
