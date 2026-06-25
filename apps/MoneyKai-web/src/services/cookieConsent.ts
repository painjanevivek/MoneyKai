import { Platform } from 'react-native';

export type CookieConsentChoice = 'accepted' | 'declined';

export const COOKIE_CONSENT_STORAGE_KEY = 'moneykai.cookieConsent.v1';

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
  } catch {
    // Storage may be blocked in private modes. The banner can show again later.
  }
};

export const hasAnalyticsConsent = () => getCookieConsentChoice() === 'accepted';
