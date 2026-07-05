import { getBackendBaseUrl } from '@/config/environment';
import { fetchWithRetry } from './networkClient';

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
const AUTH_GATEWAY_ROUTE_MISSING_MESSAGE =
  'MoneyKai could not reach the authentication service. Check the API deployment, then try again.';
const AUTH_GATEWAY_INVALID_RESPONSE_MESSAGE =
  'Authentication service returned an invalid response. Check the auth gateway deployment, then try again.';

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

const parseSuccessResponse = async <T,>(response: Response): Promise<T> => {
  const text = await response.text().catch(() => '');
  if (!text) {
    throw new AuthGatewayError(AUTH_GATEWAY_INVALID_RESPONSE_MESSAGE, 502);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AuthGatewayError(AUTH_GATEWAY_INVALID_RESPONSE_MESSAGE, 502);
  }
};

const requestAuthGateway = async <T,>(path: string, payload: object): Promise<T> => {
  const response = await fetchWithRetry(
    `${backendBaseUrl}${path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    {
      retries: 0,
      timeoutMs: 20_000,
    }
  );

  if (!response.ok) {
    const message = await parseErrorMessage(response, `Authentication request failed with ${response.status}.`);
    throw new AuthGatewayError(message, response.status);
  }

  return parseSuccessResponse<T>(response);
};

export const signInWithEmailGateway = async (email: string, password: string): Promise<AuthGatewayResponse> =>
  requestAuthGateway<AuthGatewayResponse>('/v1/auth/email/sign-in', {
    email: email.trim().toLowerCase(),
    password,
  });

export const createUserWithEmailGateway = async (
  email: string,
  password: string,
  displayName: string
): Promise<AuthGatewayResponse> =>
  requestAuthGateway<AuthGatewayResponse>('/v1/auth/email/sign-up', {
    email: email.trim().toLowerCase(),
    password,
    displayName: displayName.trim(),
  });

export const requestPasswordResetGateway = async (email: string): Promise<void> => {
  await requestAuthGateway<{ ok: true }>('/v1/auth/email/password-reset', {
    email: email.trim().toLowerCase(),
  });
};

export const startGoogleOAuthGateway = async (returnTo = '/dashboard'): Promise<string> => {
  const response = await requestAuthGateway<GoogleOAuthStartResponse>('/v1/auth/google/start', {
    platform: 'mobile',
    returnTo,
  });

  if (!response.authorizationUrl) {
    throw new AuthGatewayError('Google sign-in did not return a usable authorization URL.', 502);
  }

  return response.authorizationUrl;
};

export const exchangeGoogleOAuthCodeGateway = async (code: string): Promise<AuthGatewayResponse> =>
  requestAuthGateway<AuthGatewayResponse>('/v1/auth/google/exchange', {
    code,
  });

export { AuthGatewayError };
