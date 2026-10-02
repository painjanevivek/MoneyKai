import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  start: vi.fn(), exchange: vi.fn(), rateLimit: vi.fn(), openURL: vi.fn(), remove: vi.fn(),
  platform: { OS: 'ios' }, nativeToken: vi.fn(), nativeExchange: vi.fn(),
  listener: null as ((event: { url: string }) => void) | null,
}));
vi.mock('react-native', () => ({ Platform: mocks.platform, Linking: {
  addEventListener: (_type: string, listener: (event: { url: string }) => void) => {
    mocks.listener = listener;
    return { remove: mocks.remove };
  }, openURL: mocks.openURL,
} }));
vi.mock('@/services/authRateLimit', () => ({ consumeAuthAttempt: mocks.rateLimit }));
vi.mock('@/services/authGateway', () => ({ startGoogleOAuthGateway: mocks.start }));
vi.mock('@/services/authService', () => ({ signInWithGoogleOAuthCode: mocks.exchange, signInWithGoogleIdToken: mocks.nativeExchange }));
vi.mock('@/services/nativeGoogleSignIn', () => ({ requestNativeGoogleIdToken: mocks.nativeToken }));
import { signInWithGoogleAsync } from './googleAuth';

const proof = 'b'.repeat(43);
const user = { uid: 'synthetic-owner' };
const ready = async () => {
  for (let index = 0; index < 8; index++) await Promise.resolve();
  expect(mocks.listener).not.toBeNull();
};

describe('Google sign-in lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.listener = null;
    mocks.platform.OS = 'ios';
    mocks.nativeToken.mockResolvedValue('synthetic-id-token');
    mocks.nativeExchange.mockResolvedValue({ user });
    mocks.rateLimit.mockResolvedValue(undefined);
    mocks.start.mockResolvedValue({ authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth', transactionVerifier: proof });
    mocks.openURL.mockResolvedValue(undefined);
    mocks.exchange.mockResolvedValue({ user });
  });
  afterEach(() => vi.useRealTimers());

  it('uses the native chooser and Firebase credential on Android without opening a browser', async () => {
    mocks.platform.OS = 'android';
    expect(await signInWithGoogleAsync()).toEqual(user);
    expect(mocks.nativeToken).toHaveBeenCalledTimes(1);
    expect(mocks.nativeExchange).toHaveBeenCalledWith('synthetic-id-token');
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.openURL).not.toHaveBeenCalled();
    expect(mocks.listener).toBeNull();
  });

  it('does not fall back to Chrome when native selection is cancelled or unavailable', async () => {
    mocks.platform.OS = 'android';
    const cancelled = Object.assign(new Error('Cancelled'), { code: 'GOOGLE_SIGN_IN_CANCELLED' });
    mocks.nativeToken.mockRejectedValueOnce(cancelled);
    await expect(signInWithGoogleAsync()).rejects.toBe(cancelled);
    expect(mocks.nativeExchange).not.toHaveBeenCalled();
    expect(mocks.openURL).not.toHaveBeenCalled();
    expect(await signInWithGoogleAsync()).toEqual(user);
  });

  it('shares one Android account chooser across repeated requests', async () => {
    mocks.platform.OS = 'android';
    const results = await Promise.all([signInWithGoogleAsync(), signInWithGoogleAsync()]);
    expect(results).toEqual([user, user]);
    expect(mocks.nativeToken).toHaveBeenCalledTimes(1);
    expect(mocks.nativeExchange).toHaveBeenCalledTimes(1);
  });

  it('exchanges a current callback with the same attempt proof and cleans up', async () => {
    const result = signInWithGoogleAsync();
    await ready();
    mocks.listener!({ url: 'moneykai-mobile://auth/google?code=synthetic-code' });
    expect(await result).toEqual(user);
    expect(mocks.exchange).toHaveBeenCalledWith('synthetic-code', proof);
    expect(mocks.remove).toHaveBeenCalledTimes(1);
  });

  it('ignores lookalike callback URLs', async () => {
    const result = signInWithGoogleAsync();
    await ready();
    mocks.listener!({ url: 'moneykai-mobile://auth/google-attacker?code=wrong' });
    expect(mocks.exchange).not.toHaveBeenCalled();
    mocks.listener!({ url: 'moneykai-mobile://auth/google?code=current' });
    await result;
    expect(mocks.exchange).toHaveBeenCalledWith('current', proof);
  });

  it('fails immediately on cancellation and permits a new attempt', async () => {
    const result = signInWithGoogleAsync();
    const rejected = expect(result).rejects.toThrow('cancelled or rejected');
    await ready();
    mocks.listener!({ url: 'moneykai-mobile://auth/google?error=access_denied' });
    await rejected;
    expect(mocks.exchange).not.toHaveBeenCalled();
    const retry = signInWithGoogleAsync();
    await ready();
    mocks.listener!({ url: 'moneykai-mobile://auth/google?code=retry' });
    await retry;
    expect(mocks.start).toHaveBeenCalledTimes(2);
  });

  it('times out without creating a session', async () => {
    const result = signInWithGoogleAsync();
    const rejected = expect(result).rejects.toThrow('timed out');
    await ready();
    await vi.advanceTimersByTimeAsync(120_000);
    await rejected;
    expect(mocks.exchange).not.toHaveBeenCalled();
    expect(mocks.remove).toHaveBeenCalledTimes(1);
  });

  it('shares one running attempt between repeated button presses', async () => {
    const first = signInWithGoogleAsync();
    const second = signInWithGoogleAsync();
    await ready();
    mocks.listener!({ url: 'moneykai-mobile://auth/google?code=current' });
    expect(await first).toEqual(user);
    expect(await second).toEqual(user);
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.exchange).toHaveBeenCalledTimes(1);
  });
});
