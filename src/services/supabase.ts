import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Sentinel detection ────────────────────────────────────────────────────────
const PLACEHOLDER_PATTERNS = [
  'placeholder',
  'REPLACE_ME',
  'your-project',
  'your-anon-key',
];

/** Returns true when the value is non-empty and contains no sentinel pattern. */
const isRealValue = (value: string): boolean =>
  value.length > 0 && !PLACEHOLDER_PATTERNS.some((p) => value.includes(p));

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Always pass a guaranteed-valid HTTP URL so createClient never throws
// "Invalid supabaseUrl" — even when the .env still has sentinel values.
const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder-anon-key';

const supabaseUrl = isRealValue(rawUrl) ? rawUrl : FALLBACK_URL;
const supabaseAnonKey = isRealValue(rawKey) ? rawKey : FALLBACK_KEY;

// ─── SSR-safe storage ─────────────────────────────────────────────────────────
// Expo Router runs a server-side render pass in Node.js where `window` is
// undefined. AsyncStorage (and the @react-native-async-storage web shim) calls
// window.localStorage, which crashes the SSR process.
// We only attach AsyncStorage as session storage when we are actually running
// in a browser or React Native runtime (i.e. window / global.document exist).
const isBrowserOrNative =
  typeof window !== 'undefined' || typeof navigator !== 'undefined';

/**
 * Supabase client initialization
 *
 * - In the browser / React Native: uses AsyncStorage for session persistence.
 * - During SSR (Expo Router node render pass): uses no storage — the session
 *   is never persisted on the server so there is nothing to "recover".
 * - When .env contains sentinel values (REPLACE_ME_*): initialised against the
 *   fallback URL so the SDK doesn't throw; all auth calls are no-ops because
 *   isSupabaseConfigured() returns false and the app runs in demo mode.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isBrowserOrNative ? AsyncStorage : undefined,
    autoRefreshToken: isBrowserOrNative,
    persistSession: isBrowserOrNative,
    detectSessionInUrl: false,
  },
});

/**
 * Returns true only when both SUPABASE_URL and SUPABASE_ANON_KEY have been
 * replaced with real project values (non-empty, no sentinel substrings).
 */
export const isSupabaseConfigured = (): boolean =>
  isRealValue(rawUrl) && isRealValue(rawKey);
