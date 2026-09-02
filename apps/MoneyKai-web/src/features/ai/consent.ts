import * as React from 'react';

import { useAuthStore } from '@/stores/useAuthStore';

import type { AiPolicyAcknowledgement } from './types';

export const AI_POLICY_VERSION = 'ai-policy.v1' as const;

const storageKey = (userId: string) => `moneykai:ai-consent:${AI_POLICY_VERSION}:${userId}`;
const CONSENT_CHANGE_EVENT = 'moneykai:ai-consent-change';

export function useAiPolicyConsent() {
  const userId = useAuthStore((state) => state.user?.id ?? 'signed-out');
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => undefined;
    }
    window.addEventListener('storage', onStoreChange);
    window.addEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
    return () => {
      window.removeEventListener('storage', onStoreChange);
      window.removeEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
    };
  }, []);
  const getSnapshot = React.useCallback(
    () => typeof window !== 'undefined'
      && userId !== 'signed-out'
      && window.sessionStorage.getItem(storageKey(userId)) === 'accepted',
    [userId],
  );
  const accepted = React.useSyncExternalStore(subscribe, getSnapshot, () => false);

  const accept = React.useCallback(() => {
    if (typeof window === 'undefined' || userId === 'signed-out') {
      return;
    }
    window.sessionStorage.setItem(storageKey(userId), 'accepted');
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
  }, [userId]);

  const revoke = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(storageKey(userId));
      window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
    }
  }, [userId]);

  const acknowledgement = React.useMemo<AiPolicyAcknowledgement | null>(
    () => accepted ? { version: AI_POLICY_VERSION, consentAccepted: true } : null,
    [accepted],
  );

  return { accepted, acknowledgement, accept, revoke };
}
