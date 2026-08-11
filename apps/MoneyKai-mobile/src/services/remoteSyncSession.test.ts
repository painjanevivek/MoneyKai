import { describe, expect, it } from 'vitest';
import {
  captureRemoteSyncSession,
  invalidateRemoteSyncSession,
  isRemoteSyncSessionCurrent,
} from '../../../../packages/domain/src/syncSession';

describe('remote sync session binding', () => {
  it('accepts work only while the initiating account remains active', () => {
    const session = captureRemoteSyncSession('user-a');

    expect(isRemoteSyncSessionCurrent(session, 'user-a')).toBe(true);
    expect(isRemoteSyncSessionCurrent(session, 'user-b')).toBe(false);
    expect(isRemoteSyncSessionCurrent(session, null)).toBe(false);
  });

  it('rejects an older request after sign-out even if the same account signs in again', () => {
    const staleSession = captureRemoteSyncSession('user-a');
    invalidateRemoteSyncSession();

    expect(isRemoteSyncSessionCurrent(staleSession, 'user-a')).toBe(false);
  });

  it('allows a new request captured after invalidation', () => {
    invalidateRemoteSyncSession();
    const currentSession = captureRemoteSyncSession('user-a');

    expect(isRemoteSyncSessionCurrent(currentSession, 'user-a')).toBe(true);
  });
});
