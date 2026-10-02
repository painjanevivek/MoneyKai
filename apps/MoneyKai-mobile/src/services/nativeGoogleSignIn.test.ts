import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ platform: { OS: 'android' }, signIn: vi.fn(), clearSession: vi.fn(), modules: {} as Record<string, unknown> }));
vi.mock('react-native', () => ({ Platform: mocks.platform, NativeModules: mocks.modules }));
import { clearNativeGoogleSession, isGoogleSignInCancelled, requestNativeGoogleIdToken } from './nativeGoogleSignIn';

describe('native Google credential bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.platform.OS = 'android';
    mocks.modules.MoneyKaiGoogleSignIn = { signIn: mocks.signIn, clearSession: mocks.clearSession };
    mocks.signIn.mockResolvedValue('synthetic-token');
  });
  it('requests an explicit system account selection with the public web client ID', async () => {
    expect(await requestNativeGoogleIdToken()).toBe('synthetic-token');
    expect(mocks.signIn).toHaveBeenCalledWith(expect.stringMatching(/\.apps\.googleusercontent\.com$/));
  });
  it('fails safely if the installed binary has no native module', async () => {
    delete mocks.modules.MoneyKaiGoogleSignIn;
    await expect(requestNativeGoogleIdToken()).rejects.toThrow('update MoneyKai');
  });
  it('rejects an empty credential', async () => {
    mocks.signIn.mockResolvedValue(' ');
    await expect(requestNativeGoogleIdToken()).rejects.toThrow('credential');
  });
  it('recognizes cancellation without swallowing other failures', () => {
    expect(isGoogleSignInCancelled({ code: 'GOOGLE_SIGN_IN_CANCELLED' })).toBe(true);
    expect(isGoogleSignInCancelled(new Error('failed'))).toBe(false);
    expect(isGoogleSignInCancelled(null)).toBe(false);
  });
  it('clears selection state without blocking logout if the provider fails', async () => {
    mocks.clearSession.mockRejectedValue(new Error('unavailable'));
    await expect(clearNativeGoogleSession()).resolves.toBeUndefined();
    expect(mocks.clearSession).toHaveBeenCalledOnce();
  });
});
