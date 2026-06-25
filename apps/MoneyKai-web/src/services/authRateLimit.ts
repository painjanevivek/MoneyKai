import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthRateLimitAction = 'sign-in' | 'sign-up' | 'google-sign-in' | 'password-reset';

type AuthRateLimitPolicy = {
  maxAttempts: number;
  windowMs: number;
  lockoutMs: number;
  label: string;
};

type AuthRateLimitEntry = {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
};

const STORAGE_PREFIX = 'moneykai:auth-rate-limit:v1';
const MINUTE_MS = 60 * 1000;

const POLICIES: Record<AuthRateLimitAction, AuthRateLimitPolicy> = {
  'sign-in': {
    maxAttempts: 5,
    windowMs: 15 * MINUTE_MS,
    lockoutMs: 15 * MINUTE_MS,
    label: 'sign-in',
  },
  'sign-up': {
    maxAttempts: 4,
    windowMs: 60 * MINUTE_MS,
    lockoutMs: 60 * MINUTE_MS,
    label: 'account creation',
  },
  'google-sign-in': {
    maxAttempts: 8,
    windowMs: 15 * MINUTE_MS,
    lockoutMs: 15 * MINUTE_MS,
    label: 'Google sign-in',
  },
  'password-reset': {
    maxAttempts: 3,
    windowMs: 60 * MINUTE_MS,
    lockoutMs: 60 * MINUTE_MS,
    label: 'password reset',
  },
};

const normalizeIdentifier = (identifier: string) =>
  identifier.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_').slice(0, 120) || 'anonymous';

const getStorageKey = (action: AuthRateLimitAction, identifier: string) =>
  `${STORAGE_PREFIX}:${action}:${normalizeIdentifier(identifier)}`;

const readEntry = async (action: AuthRateLimitAction, identifier: string): Promise<AuthRateLimitEntry | null> => {
  try {
    const raw = await AsyncStorage.getItem(getStorageKey(action, identifier));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthRateLimitEntry>;
    if (typeof parsed.count !== 'number' || typeof parsed.firstAttemptAt !== 'number') {
      return null;
    }

    return {
      count: parsed.count,
      firstAttemptAt: parsed.firstAttemptAt,
      lockedUntil: typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : undefined,
    };
  } catch {
    return null;
  }
};

const writeEntry = async (action: AuthRateLimitAction, identifier: string, entry: AuthRateLimitEntry) => {
  await AsyncStorage.setItem(getStorageKey(action, identifier), JSON.stringify(entry));
};

const removeEntry = async (action: AuthRateLimitAction, identifier: string) => {
  await AsyncStorage.removeItem(getStorageKey(action, identifier));
};

const formatRetryAfter = (retryAfterMs: number) => {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / MINUTE_MS));
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
};

export const createAuthRateLimitError = (action: AuthRateLimitAction, retryAfterMs: number) =>
  new Error(`Too many ${POLICIES[action].label} attempts. Please wait ${formatRetryAfter(retryAfterMs)} and try again.`);

export const assertAuthAttemptAllowed = async (action: AuthRateLimitAction, identifier: string) => {
  const entry = await readEntry(action, identifier);
  const now = Date.now();

  if (!entry) {
    return;
  }

  if (entry.lockedUntil && entry.lockedUntil > now) {
    throw createAuthRateLimitError(action, entry.lockedUntil - now);
  }

  const policy = POLICIES[action];
  if (entry.firstAttemptAt + policy.windowMs <= now) {
    await removeEntry(action, identifier);
  }
};

export const recordFailedAuthAttempt = async (action: AuthRateLimitAction, identifier: string) => {
  const policy = POLICIES[action];
  const now = Date.now();
  const existing = await readEntry(action, identifier);
  const entry =
    existing && existing.firstAttemptAt + policy.windowMs > now
      ? { ...existing, count: existing.count + 1 }
      : { count: 1, firstAttemptAt: now };

  if (entry.count > policy.maxAttempts) {
    entry.lockedUntil = now + policy.lockoutMs;
  }

  await writeEntry(action, identifier, entry);

  if (entry.lockedUntil && entry.lockedUntil > now) {
    throw createAuthRateLimitError(action, entry.lockedUntil - now);
  }
};

export const consumeAuthAttempt = async (action: AuthRateLimitAction, identifier: string) => {
  await assertAuthAttemptAllowed(action, identifier);
  await recordFailedAuthAttempt(action, identifier);
};

export const clearAuthRateLimit = async (action: AuthRateLimitAction, identifier: string) => {
  await removeEntry(action, identifier);
};
