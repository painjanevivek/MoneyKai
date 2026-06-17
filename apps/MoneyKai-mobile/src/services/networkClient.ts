import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { MMKV } from 'react-native-mmkv';

const CACHE_PREFIX = 'moneykai:data-cache:v1:';
const CACHE_ENCRYPTION_KEY = 'moneykai-backend-cache-v1';
const cacheStore = createCacheStore();

export type NetworkErrorCode = 'OFFLINE' | 'TIMEOUT' | 'HTTP' | 'NETWORK';

export class NetworkRequestError extends Error {
  constructor(
    message: string,
    public code: NetworkErrorCode,
    public status = 0,
    public retriable = true,
  ) {
    super(message);
    this.name = 'NetworkRequestError';
  }
}

export type NetworkStatus = {
  isOnline: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

export type CacheEnvelope<T> = {
  value: T;
  cachedAt: string;
  expiresAt?: string;
};

export const getNetworkStatus = async (): Promise<NetworkStatus> => {
  const state = await NetInfo.fetch();
  const isConnected = state.isConnected ?? null;
  const isInternetReachable = state.isInternetReachable ?? null;

  return {
    isConnected,
    isInternetReachable,
    isOnline: isConnected !== false && isInternetReachable !== false,
  };
};

export const isOnline = async () => (await getNetworkStatus()).isOnline;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isRetriableError = (error: unknown): boolean => {
  if (error instanceof NetworkRequestError) {
    return error.retriable;
  }
  if (error instanceof Error) {
    return /network|fetch|timeout|offline|aborted|failed/i.test(error.message);
  }
  return false;
};

export async function retryAsync<T>(
  task: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number; maxDelayMs?: number } = {},
): Promise<T> {
  const retries = options.retries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 350;
  const maxDelayMs = options.maxDelayMs ?? 2500;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !isRetriableError(error)) {
        throw error;
      }

      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: { timeoutMs?: number; retries?: number; retryUnsafe?: boolean } = {},
): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const shouldRetry = method === 'GET' || options.retryUnsafe === true;
  const timeoutMs = options.timeoutMs ?? 20_000;

  return retryAsync(
    async () => {
      const status = await getNetworkStatus().catch(() => null);
      if (status && !status.isOnline) {
        throw new NetworkRequestError('You appear to be offline.', 'OFFLINE', 0, true);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(input, {
          ...init,
          signal: init.signal ?? controller.signal,
        });

        if ((response.status === 408 || response.status === 429 || response.status >= 500) && shouldRetry) {
          throw new NetworkRequestError(`Request failed with ${response.status}.`, 'HTTP', response.status, true);
        }

        return response;
      } catch (error) {
        if (error instanceof NetworkRequestError) {
          throw error;
        }
        if (error instanceof Error && error.name === 'AbortError') {
          throw new NetworkRequestError('The request timed out.', 'TIMEOUT', 0, true);
        }
        throw new NetworkRequestError(
          error instanceof Error ? error.message : 'The network request failed.',
          'NETWORK',
          0,
          true,
        );
      } finally {
        clearTimeout(timeoutId);
      }
    },
    { retries: shouldRetry ? options.retries ?? 2 : 0 },
  );
}

const cacheKey = (key: string) => `${CACHE_PREFIX}${key}`;

export async function readDataCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
  try {
    const raw = await cacheStore.get(cacheKey(key));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}

export async function writeDataCache<T>(key: string, value: T, ttlMs?: number): Promise<CacheEnvelope<T>> {
  const cachedAt = new Date().toISOString();
  const envelope: CacheEnvelope<T> = {
    value,
    cachedAt,
    expiresAt: ttlMs ? new Date(Date.now() + ttlMs).toISOString() : undefined,
  };

  await cacheStore.set(cacheKey(key), JSON.stringify(envelope));
  return envelope;
}

export const isCacheFresh = <T>(cache: CacheEnvelope<T> | null): cache is CacheEnvelope<T> => {
  if (!cache) {
    return false;
  }
  return !cache.expiresAt || new Date(cache.expiresAt).getTime() > Date.now();
};

function createCacheStore(): {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
} {
  try {
    const mmkv = new MMKV({
      id: 'moneykai-backend-cache',
      encryptionKey: CACHE_ENCRYPTION_KEY,
    });
    return {
      get: async (key) => mmkv.getString(key) ?? null,
      set: async (key, value) => {
        mmkv.set(key, value);
      },
    };
  } catch {
    return {
      get: (key) => AsyncStorage.getItem(key),
      set: (key, value) => AsyncStorage.setItem(key, value),
    };
  }
}
