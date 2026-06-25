import { Linking } from 'react-native';
import { consumeAuthAttempt } from '@/services/authRateLimit';
import { startGoogleOAuthGateway } from '@/services/authGateway';
import { signInWithGoogleOAuthCode, type NativeFirebaseUser } from '@/services/authService';

const GOOGLE_OAUTH_TIMEOUT_MS = 2 * 60 * 1000;
const GOOGLE_CALLBACK_PREFIX = 'moneykai-mobile://auth/google';

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

const extractGoogleOAuthCode = (url: string): string => {
  if (!url.startsWith(GOOGLE_CALLBACK_PREFIX)) {
    return '';
  }

  return getQueryParam(url, 'code');
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

      const code = extractGoogleOAuthCode(url);
      if (code) {
        settle(() => resolve(code));
      }
    };

    const timeout = setTimeout(() => {
      settle(() => reject(new Error('Google sign-in timed out. Please try again.')));
    }, GOOGLE_OAUTH_TIMEOUT_MS);

    subscription = Linking.addEventListener('url', (event) => consumeUrl(event.url));

    void Linking.openURL(authorizationUrl)
      .then(() => Linking.getInitialURL().then(consumeUrl).catch(() => undefined))
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
    const authorizationUrl = await startGoogleOAuthGateway('/dashboard');
    const code = await waitForGoogleOAuthCode(authorizationUrl);
    const credentials = await signInWithGoogleOAuthCode(code);
    return credentials.user;
  })();

  try {
    return await pendingGoogleSignIn;
  } finally {
    pendingGoogleSignIn = null;
  }
};
