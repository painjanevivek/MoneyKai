import { Linking, Platform } from 'react-native';
import { consumeAuthAttempt } from '@/services/authRateLimit';
import { startGoogleOAuthGateway } from '@/services/authGateway';
import { signInWithGoogleIdToken, signInWithGoogleOAuthCode, type NativeFirebaseUser } from '@/services/authService';
import { requestNativeGoogleIdToken } from '@/services/nativeGoogleSignIn';

const GOOGLE_OAUTH_TIMEOUT_MS = 2 * 60 * 1000;

let pendingGoogleSignIn: Promise<NativeFirebaseUser> | null = null;

const getQueryParam = (url: string, key: string): string => {
  const query = url.split('?')[1]?.split('#')[0] || '';
  for (const pair of query.split('&')) {
    const [rawName, rawValue = ''] = pair.split('=');
    try {
      if (decodeURIComponent(rawName || '') === key) {
        return decodeURIComponent(rawValue.replace(/\+/g, ' '));
      }
    } catch {
      return '';
    }
  }

  return '';
};

const isGoogleOAuthCallback = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'moneykai-mobile:' && parsed.hostname === 'auth' && parsed.pathname === '/google';
  } catch {
    return false;
  }
};

const waitForGoogleOAuthCode = async (authorizationUrl: string): Promise<string> =>
  new Promise((resolve, reject) => {
    let settled = false;
    let subscription: { remove: () => void } | null = null;

    const cleanup = () => {
      subscription?.remove();
      clearTimeout(timeout);
    };

    const settle = (handler: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      handler();
    };

    const consumeUrl = (url: string | null) => {
      if (!url) {
        return;
      }

      if (!isGoogleOAuthCallback(url)) {
        return;
      }
      if (getQueryParam(url, 'error')) {
        settle(() => reject(new Error('Google sign-in was cancelled or rejected. Please try again.')));
        return;
      }
      const code = getQueryParam(url, 'code');
      if (code) {
        settle(() => resolve(code));
      }
    };

    const timeout = setTimeout(() => {
      settle(() => reject(new Error('Google sign-in timed out. Please try again.')));
    }, GOOGLE_OAUTH_TIMEOUT_MS);

    subscription = Linking.addEventListener('url', (event) => consumeUrl(event.url));

    void Linking.openURL(authorizationUrl)
      .catch(() => {
        settle(() => reject(new Error('Could not open Google sign-in. Please check your browser settings and try again.')));
      });
  });

export const signInWithGoogleAsync = async (): Promise<NativeFirebaseUser> => {
  if (pendingGoogleSignIn) {
    return pendingGoogleSignIn;
  }

  pendingGoogleSignIn = (async () => {
    await consumeAuthAttempt('google-sign-in', 'google');
    if (Platform.OS === 'android') {
      const token = await requestNativeGoogleIdToken();
      const credentials = await signInWithGoogleIdToken(token);
      return credentials.user;
    }
    const { authorizationUrl, transactionVerifier } = await startGoogleOAuthGateway('/dashboard');
    const code = await waitForGoogleOAuthCode(authorizationUrl);
    // Keep proof in this attempt's memory only. Never persist it or accept a
    // stale launch URL left over from a previous sign-in.
    const credentials = await signInWithGoogleOAuthCode(code, transactionVerifier);
    return credentials.user;
  })();

  try {
    return await pendingGoogleSignIn;
  } finally {
    pendingGoogleSignIn = null;
  }
};
