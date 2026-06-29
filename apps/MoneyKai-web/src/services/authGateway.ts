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

const getAuthGatewayUrl = (path: string, useApiPrefix = false): string => {
  const normalizedPath = useApiPrefix && !path.startsWith('/api/')
    ? `/api${path}`
    : path;

  return `${backendBaseUrl}${normalizedPath}`;
};

const isSameOriginBackend = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const backendUrl = new URL(backendBaseUrl || window.location.origin, window.location.origin);
    return backendUrl.origin === window.location.origin;
  } catch {
    return false;
  }
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

const requestAuthGateway = async <T,>(path: string, payload: object): Promise<T> => {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  };

  let response = await fetch(getAuthGatewayUrl(path), requestInit);

  if (response.status === 404 && isSameOriginBackend() && !path.startsWith('/api/')) {
    response = await fetch(getAuthGatewayUrl(path, true), requestInit);
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response, `Authentication request failed with ${response.status}.`);
    throw new AuthGatewayError(message, response.status);
  }

  return (await response.json()) as T;
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
