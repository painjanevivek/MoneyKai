import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  sensorAvailable: false,
  isDeviceSecure: vi.fn(async () => true),
  confirmDeviceCredential: vi.fn(async () => true),
  setSplashAppLockEnabled: vi.fn(async () => undefined),
  consumeSplashAppLockResult: vi.fn(async () => 'verified'),
  simplePrompt: vi.fn(async () => ({ success: true })),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 34 },
  NativeModules: {
    MoneyKaiDeviceCredential: {
      isDeviceSecure: mock.isDeviceSecure,
      confirmDeviceCredential: mock.confirmDeviceCredential,
      setSplashAppLockEnabled: mock.setSplashAppLockEnabled,
      consumeSplashAppLockResult: mock.consumeSplashAppLockResult,
    },
  },
}));
vi.mock('react-native-biometrics', () => ({
  default: class {
    isSensorAvailable = async () => ({ available: mock.sensorAvailable });
    simplePrompt = mock.simplePrompt;
  },
}));

import {
  authenticateDeviceOwner,
  canAuthenticateDeviceOwner,
  consumeSplashAppLockResult,
  syncSplashAppLockEnabled,
} from './deviceOwnerAuthentication';

describe('device-owner authentication handoff', () => {
  beforeEach(() => {
    mock.sensorAvailable = false;
    mock.isDeviceSecure.mockClear();
    mock.confirmDeviceCredential.mockClear();
    mock.setSplashAppLockEnabled.mockClear();
    mock.consumeSplashAppLockResult.mockClear();
    mock.simplePrompt.mockClear();
  });

  it('accepts a secure device credential when no fingerprint sensor is available', async () => {
    expect(await canAuthenticateDeviceOwner()).toBe(true);
    expect(await authenticateDeviceOwner('Unlock MoneyKai')).toBe(true);
    expect(mock.confirmDeviceCredential).toHaveBeenCalledTimes(1);
    expect(mock.simplePrompt).not.toHaveBeenCalled();
  });

  it('passes the splash lock setting and consumes native verification', async () => {
    await syncSplashAppLockEnabled(true);
    expect(mock.setSplashAppLockEnabled).toHaveBeenCalledWith(true);
    expect(await consumeSplashAppLockResult()).toBe('verified');
  });
});
