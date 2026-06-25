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

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
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

  return (await response.json()) as T;
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
