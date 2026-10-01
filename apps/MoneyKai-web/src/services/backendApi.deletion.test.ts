import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backendApi } from './backendApi';
const mock = vi.hoisted(() => ({ auth: { currentUser: null as null | { uid: string; getIdToken: () => Promise<string> } } }));
vi.mock('@/config/environment', () => ({ getBackendBaseUrl: () => 'https://backend.example.test' }));
vi.mock('./firebase', () => ({ firebaseAuth: mock.auth }));
describe('owner-bound deletion token', () => {
  beforeEach(() => { mock.auth.currentUser = { uid: 'owner', getIdToken: async () => 'owner-token' }; vi.stubGlobal('fetch', vi.fn(async () => new Response('{}'))); });
  it('sends authenticated DELETE with the stable key and no user-supplied owner in the body', async () => {
    await backendApi.deleteAccount('stable-key', 'owner');
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://backend.example.test/v1/settings/account');
    expect(options?.method).toBe('DELETE'); expect(options?.body).toBeUndefined();
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer owner-token');
    expect(new Headers(options?.headers).get('Idempotency-Key')).toBe('stable-key');
  });
  it('rejects a Firebase/store owner mismatch without a request', async () => {
    await expect(backendApi.deleteAccount('key', 'other')).rejects.toThrow('account changed');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects an account switch during token retrieval without a request', async () => {
    mock.auth.currentUser!.getIdToken = async () => { mock.auth.currentUser = { uid: 'other', getIdToken: async () => 'other-token' }; return 'owner-token'; };
    await expect(backendApi.deleteAccount('key', 'owner')).rejects.toThrow('account changed');
    expect(fetch).not.toHaveBeenCalled();
  });
});
