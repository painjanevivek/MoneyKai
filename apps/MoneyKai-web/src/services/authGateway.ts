import { signInWithCustomToken, type UserCredential } from 'firebase/auth';
import { getBackendBaseUrl } from '@/config/environment';
import { firebaseAuth } from '@/services/firebase';

type AuthGatewayResponse = {
  customToken: string;
  returnTo?: string;
  user?: {
    uid?: string;
    email?: string;
    displayName?: string;
  };
};

type GoogleOAuthStartResponse = {
  authorizationUrl: string;
};

class AuthGatewayError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'AuthGatewayError';
  }
}

const backendBaseUrl = getBackendBaseUrl();
const AUTH_GATEWAY_TIMEOUT_MS = 5_000;

const withApiPrefix = (path: string): string =>
  path.startsWith('/api/') ? path : `/api${path}`;

const getRuntimeOrigin = (): string =>
  typeof window === 'undefined' ? '' : window.location.origin;

const appendUnique = (values: string[], value: string) => {
  if (value && !values.includes(value)) {
    values.push(value);
  }
};

const getAuthGatewayUrls = (path: string): string[] => {
  const urls: string[] = [];
  const runtimeOrigin = getRuntimeOrigin();

  if (runtimeOrigin) {
    appendUnique(urls, `${runtimeOrigin}${withApiPrefix(path)}`);
  }

  appendUnique(urls, `${backendBaseUrl}${path}`);
  appendUnique(urls, `${backendBaseUrl}${withApiPrefix(path)}`);

  return urls;
};

const parseErrorMessage = async (response: Response, fallback: string) => {
  const text = await response.text().catch(() => '');
  if (!text) {
    return fallback;
  }

  try {
    const payload = JSON.parse(text);
    return payload.error || payload.message || fallback;
  } catch {
    return fallback;
  }
};

const fetchAuthGateway = async (url: string, init: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_GATEWAY_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const requestAuthGateway = async <T,>(path: string, payload: object): Promise<T> => {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  };
  const urls = getAuthGatewayUrls(path);
  let lastResponse: Response | null = null;
  let lastNetworkError: unknown = null;

  for (const url of urls) {
    try {
      const response = await fetchAuthGateway(url, requestInit);
      lastResponse = response;

      if (response.ok) {
        return (await response.json()) as T;
      }

      if (![404, 405].includes(response.status)) {
        break;
      }
    } catch (error) {
      lastNetworkError = error;
    }
  }

  if (lastResponse) {
    const message = await parseErrorMessage(lastResponse, `Authentication request failed with ${lastResponse.status}.`);
    throw new AuthGatewayError(message, lastResponse.status);
  }

  throw new AuthGatewayError(
    lastNetworkError instanceof Error
      ? lastNetworkError.message
      : 'Authentication service is unreachable.',
    0,
  );
};

const signInWithGatewayToken = async (response: AuthGatewayResponse): Promise<UserCredential> => {
  if (!response.customToken) {
    throw new AuthGatewayError('Authentication service did not return a usable session token.', 502);
  }

  return signInWithCustomToken(firebaseAuth, response.customToken);
};

export const signInWithEmailGateway = async (email: string, password: string): Promise<UserCredential> => {
  const response = await requestAuthGateway<AuthGatewayResponse>('/v1/auth/email/sign-in', {
    email: email.trim().toLowerCase(),
    password,
  });
  return signInWithGatewayToken(response);
};

export const createUserWithEmailGateway = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> => {
  const response = await requestAuthGateway<AuthGatewayResponse>('/v1/auth/email/sign-up', {
    email: email.trim().toLowerCase(),
    password,
    displayName: displayName.trim(),
  });
  return signInWithGatewayToken(response);
};

export const requestPasswordResetGateway = async (email: string): Promise<void> => {
  await requestAuthGateway<{ ok: true }>('/v1/auth/email/password-reset', {
    email: email.trim().toLowerCase(),
  });
};

export const startGoogleOAuthGateway = async (returnTo = '/dashboard'): Promise<string> => {
  const response = await requestAuthGateway<GoogleOAuthStartResponse>('/v1/auth/google/start', {
    platform: 'web',
    returnTo,
  });

  if (!response.authorizationUrl) {
    throw new AuthGatewayError('Google sign-in did not return a usable authorization URL.', 502);
  }

  return response.authorizationUrl;
};

export const exchangeGoogleOAuthCodeGateway = async (
  code: string
): Promise<{ credentials: UserCredential; returnTo: string }> => {
  const response = await requestAuthGateway<AuthGatewayResponse>('/v1/auth/google/exchange', {
    code,
  });

  return {
    credentials: await signInWithGatewayToken(response),
    returnTo: response.returnTo || '/dashboard',
  };
};

export { AuthGatewayError };
