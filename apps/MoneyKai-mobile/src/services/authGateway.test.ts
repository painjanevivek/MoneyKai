import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ fetchWithRetry: vi.fn() }));
vi.mock('@/config/environment', () => ({ getBackendBaseUrl: () => 'https://api.example.com' }));
vi.mock('./networkClient', () => ({ fetchWithRetry: mocks.fetchWithRetry }));
import { exchangeGoogleOAuthCodeGateway, signInWithEmailGateway, startGoogleOAuthGateway } from './authGateway';

const proof = 'a'.repeat(43);
const url = 'https://accounts.google.com/o/oauth2/v2/auth?state=test';
const success = (value: object) => new Response(JSON.stringify(value), { status: 200 });

describe('production auth gateway', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps the Google transaction proof returned by the backend', async () => {
    mocks.fetchWithRetry.mockResolvedValueOnce(success({ authorizationUrl: url, transactionVerifier: proof }));
    expect(await startGoogleOAuthGateway()).toEqual({ authorizationUrl: url, transactionVerifier: proof });
  });

  it.each([undefined, '', 'too-short', 'a'.repeat(300), '<'.repeat(43)])('rejects missing or malformed transaction proof: %s', async (transactionVerifier) => {
    mocks.fetchWithRetry.mockResolvedValueOnce(success({ authorizationUrl: url, transactionVerifier }));
    await expect(startGoogleOAuthGateway()).rejects.toThrow('secure transaction');
  });

  it.each(['http://accounts.google.com/o/oauth2/v2/auth', 'https://accounts.google.com.attacker.example/o/oauth2/v2/auth', 'https://accounts.google.com/other'])('does not open an untrusted sign-in URL: %s', async (authorizationUrl) => {
    mocks.fetchWithRetry.mockResolvedValueOnce(success({ authorizationUrl, transactionVerifier: proof }));
    await expect(startGoogleOAuthGateway()).rejects.toThrow('untrusted authorization URL');
  });

  it('sends the attempt proof when exchanging an OAuth code', async () => {
    mocks.fetchWithRetry.mockResolvedValueOnce(success({ customToken: 'synthetic-token' }));
    await exchangeGoogleOAuthCodeGateway('synthetic-code', proof);
    const [requestUrl, request] = mocks.fetchWithRetry.mock.calls[0];
    expect(requestUrl).toBe('https://api.example.com/v1/auth/google/exchange');
    expect(JSON.parse(request.body)).toEqual({ code: 'synthetic-code', transactionVerifier: proof });
  });

  it('tries the API-prefixed route on an absent email endpoint', async () => {
    mocks.fetchWithRetry.mockResolvedValueOnce(new Response('Not found', { status: 404 }))
      .mockResolvedValueOnce(success({ customToken: 'synthetic-token' }));
    await signInWithEmailGateway(' Test@Example.com ', 'synthetic-password');
    expect(mocks.fetchWithRetry.mock.calls[1][0]).toBe('https://api.example.com/api/v1/auth/email/sign-in');
    expect(JSON.parse(mocks.fetchWithRetry.mock.calls[1][1].body).email).toBe('test@example.com');
  });
});
