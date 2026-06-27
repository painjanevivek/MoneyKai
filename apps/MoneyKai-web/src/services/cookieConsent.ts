import { Platform } from 'react-native';

export type CookieConsentChoice = 'accepted' | 'declined';
export type CookieConsentSnapshot = CookieConsentChoice | null | 'pending';

export const COOKIE_CONSENT_STORAGE_KEY = 'moneykai.cookieConsent.v1';
export const COOKIE_CONSENT_CHANGED_EVENT = 'moneykai.cookieConsent.changed';

type StoredCookieConsent = {
  choice: CookieConsentChoice;
  decidedAt: string;
};

const isCookieConsentChoice = (value: unknown): value is CookieConsentChoice =>
  value === 'accepted' || value === 'declined';

const canUseBrowserStorage = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getCookieConsentChoice = (): CookieConsentChoice | null => {
  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredCookieConsent>;
    return isCookieConsentChoice(parsed.choice) ? parsed.choice : null;
  } catch {
    return null;
  }
};

export const getCookieConsentSnapshot = (): CookieConsentSnapshot => getCookieConsentChoice();

export const getCookieConsentServerSnapshot = (): CookieConsentSnapshot => 'pending';

export const subscribeCookieConsent = (listener: () => void) => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === COOKIE_CONSENT_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, listener);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, listener);
    window.removeEventListener('storage', handleStorage);
  };
};

export const setCookieConsentChoice = (choice: CookieConsentChoice) => {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    const payload: StoredCookieConsent = {
      choice,
      decidedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: { choice } }));
  } catch {
    // Storage may be blocked in private modes. The banner can show again later.
  }
};

export const hasAnalyticsConsent = () => getCookieConsentChoice() === 'accepted';
