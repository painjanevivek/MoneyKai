import type { SyncStatus } from '@/stores/useSyncStore';

export type GroupsLandingState = 'sign-in' | 'loading' | 'connection-error' | 'empty' | 'ready';

export function resolveGroupsLandingState(input: {
  hasUser: boolean;
  demoMode: boolean;
  groupCount: number;
  syncStatus: SyncStatus;
  cachedAt: string | null;
  syncError: string | null;
}): GroupsLandingState {
  const { hasUser, demoMode, groupCount, syncStatus, cachedAt, syncError } = input;
  if (!hasUser) return 'sign-in';
  if (groupCount > 0) return 'ready';
  if (demoMode) return 'empty';
  if (syncStatus === 'syncing' && !cachedAt) return 'loading';
  if (syncStatus === 'failed' && !cachedAt) {
    if (/\bsign(?:ed)?[\s-]*in\b|\bunauthori[sz]ed\b|\bauthentication\b|\btoken\b|\b401\b|\b403\b/i.test(syncError ?? '')) return 'sign-in';
    return 'connection-error';
  }
  return 'empty';
}
