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
  redirectUri?: string;
  transactionVerifier: string;
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
const AUTH_GATEWAY_ROUTE_MISSING_MESSAGE =
  'MoneyKai could not reach the authentication service. Check the web API deployment, then try again.';
const AUTH_GATEWAY_INVALID_RESPONSE_MESSAGE =
  'Authentication service returned an invalid response. Check the auth gateway deployment, then try again.';
const GOOGLE_OAUTH_TRANSACTION_KEY = 'moneykai:google-oauth:transaction-verifier';

const getSessionStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const getAuthGatewayUrl = (path: string): string => `${backendBaseUrl}${path}`;

const readMessage = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return readMessage(record.message) ?? readMessage(record.error);
  }

  return null;
};

const isMissingRouteResponse = (response: Response, message: string): boolean =>
  [404, 405].includes(response.status) &&
  /the page could not be found|not_found|method not allowed|cannot post|not found/i.test(message);

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const text = await response.text().catch(() => '');
  if (!text) {
    return [404, 405].includes(response.status) ? AUTH_GATEWAY_ROUTE_MISSING_MESSAGE : fallback;
  }

  try {
    const payload = JSON.parse(text) as unknown;
    const message = readMessage(payload) ?? fallback;
    return isMissingRouteResponse(response, message) ? AUTH_GATEWAY_ROUTE_MISSING_MESSAGE : message;
  } catch {
    return isMissingRouteResponse(response, text) ? AUTH_GATEWAY_ROUTE_MISSING_MESSAGE : fallback;
  }
};

const parseSuccessResponse = async <T,>(response: Response): Promise<T | null> => {
  const text = await response.text().catch(() => '');
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
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
  let response: Response;
  try {
    response = await fetchAuthGateway(getAuthGatewayUrl(path), requestInit);
  } catch (error) {
    throw new AuthGatewayError(
      error instanceof Error ? error.message : 'Authentication service is unreachable.',
      0,
    );
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response, `Authentication request failed with ${response.status}.`);
    throw new AuthGatewayError(message, response.status);
  }

  const responsePayload = await parseSuccessResponse<T>(response);
  if (!responsePayload) {
    throw new AuthGatewayError(AUTH_GATEWAY_INVALID_RESPONSE_MESSAGE, 502);
  }
  return responsePayload;
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

export const changePasswordGateway = async (
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  await requestAuthGateway<{ ok: true }>('/v1/auth/email/change-password', {
    email: email.trim().toLowerCase(),
    currentPassword,
    newPassword,
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

  if (!response.transactionVerifier || !getSessionStorage()) {
    throw new AuthGatewayError('Google sign-in could not create a secure browser transaction.', 502);
  }

  getSessionStorage()?.setItem(GOOGLE_OAUTH_TRANSACTION_KEY, response.transactionVerifier);

  return response.authorizationUrl;
};

export const exchangeGoogleOAuthCodeGateway = async (
  code: string
): Promise<{ credentials: UserCredential; returnTo: string }> => {
  const storage = getSessionStorage();
  const transactionVerifier = storage?.getItem(GOOGLE_OAUTH_TRANSACTION_KEY) || '';
  if (!transactionVerifier) {
    throw new AuthGatewayError('This Google sign-in was not started in this browser. Please try again.', 403);
  }

  const response = await requestAuthGateway<AuthGatewayResponse>('/v1/auth/google/exchange', {
    code,
    transactionVerifier,
  });
  storage?.removeItem(GOOGLE_OAUTH_TRANSACTION_KEY);

  return {
    credentials: await signInWithGatewayToken(response),
    returnTo: response.returnTo || '/dashboard',
  };
};

export const isRecoverableGoogleAuthGatewayError = (error: unknown): boolean => {
  const status = error instanceof AuthGatewayError ? error.status : null;
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('not configured')) {
    return false;
  }

  return (
    status === 0 ||
    status === 404 ||
    status === 405 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    message.includes('unreachable') ||
    message.includes('aborted') ||
    message.includes('google oauth') ||
    message.includes('google sign-in failed') ||
    message.includes('the page could not be found') ||
    message.includes('authentication service returned an invalid response') ||
    message.includes('could not reach the authentication service')
  );
};

export { AuthGatewayError };
