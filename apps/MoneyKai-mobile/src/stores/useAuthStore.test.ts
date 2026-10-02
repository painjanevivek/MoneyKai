import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  demoMode: false,
  syncRemoteState: vi.fn(),
  resetLocalAppState: vi.fn(),
  waitForAuthState: vi.fn(),
  waitForHomeStateHydration: vi.fn(async () => undefined),
  waitForLocalStateHydration: vi.fn(async () => undefined),
  waitForPersistedStore: vi.fn(async () => undefined),
  consumeSplashAppLockResult: vi.fn(async () => 'none'),
  clearDeviceOwnerVerification: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
    removeItem: vi.fn(async () => undefined),
  },
}));
vi.mock('../config/environment', () => ({ isDemoModeEnabled: () => mock.demoMode }));
vi.mock('@moneykai/domain/syncSession', () => ({ invalidateRemoteSyncSession: vi.fn() }));
vi.mock('../services/authService', () => ({
  isFirebaseConfigured: () => true,
  waitForAuthState: mock.waitForAuthState,
  createUserWithEmail: vi.fn(),
  signInWithEmail: vi.fn(),
  signOutFromFirebase: vi.fn(),
  updateFirebaseUserProfile: vi.fn(),
}));
vi.mock('../services/localStateHydration', () => ({
  waitForHomeStateHydration: mock.waitForHomeStateHydration,
  waitForLocalStateHydration: mock.waitForLocalStateHydration,
  waitForPersistedStore: mock.waitForPersistedStore,
}));
vi.mock('../services/remoteSync', () => ({
  syncRemoteState: mock.syncRemoteState,
  resetLocalAppState: mock.resetLocalAppState,
}));
vi.mock('../services/deviceOwnerAuthentication', () => ({
  consumeSplashAppLockResult: mock.consumeSplashAppLockResult,
  clearDeviceOwnerVerification: mock.clearDeviceOwnerVerification,
}));

import { useAuthStore } from './useAuthStore';

const firebaseUser = {
  uid: 'user-1',
  email: 'user@example.com',
  displayName: 'User',
  photoURL: null,
  providerData: [],
};

describe('cold-start session hydration', () => {
  beforeEach(() => {
    mock.demoMode = false;
    mock.syncRemoteState.mockReset();
    mock.resetLocalAppState.mockReset();
    mock.waitForAuthState.mockReset();
    mock.waitForAuthState.mockResolvedValue(firebaseUser);
    mock.waitForHomeStateHydration.mockReset();
    mock.waitForHomeStateHydration.mockResolvedValue(undefined);
    mock.waitForLocalStateHydration.mockReset();
    mock.waitForLocalStateHydration.mockResolvedValue(undefined);
    mock.consumeSplashAppLockResult.mockClear();
    mock.clearDeviceOwnerVerification.mockClear();
    useAuthStore.setState({
      user: { id: 'user-1', email: 'user@example.com', full_name: 'User' },
      isAuthenticated: true,
      isHydratingSession: true,
    });
  });

  it('opens with locally hydrated data without waiting for cloud refresh', async () => {
    mock.syncRemoteState.mockImplementation(() => new Promise(() => undefined));

    await useAuthStore.getState().hydrateSession();

    expect(useAuthStore.getState().isHydratingSession).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mock.waitForHomeStateHydration).toHaveBeenCalled();
    expect(mock.waitForLocalStateHydration).toHaveBeenCalled();
    await vi.waitFor(() => expect(mock.syncRemoteState).toHaveBeenCalledTimes(1));
    expect(mock.syncRemoteState).toHaveBeenCalledWith({ force: true, keepLocalData: true });
    expect(mock.resetLocalAppState).not.toHaveBeenCalled();
  });

  it('clears data from a different account before opening', async () => {
    useAuthStore.setState({ user: { id: 'previous-user', email: 'old@example.com', full_name: 'Old' } });
    mock.syncRemoteState.mockResolvedValue({ source: 'network', synced: true });

    await useAuthStore.getState().hydrateSession();

    expect(mock.resetLocalAppState).toHaveBeenCalledTimes(1);
    expect(mock.consumeSplashAppLockResult).toHaveBeenCalledTimes(1);
    expect(mock.clearDeviceOwnerVerification).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user?.id).toBe('user-1');
    expect(useAuthStore.getState().isHydratingSession).toBe(false);
    await vi.waitFor(() => expect(mock.syncRemoteState).toHaveBeenCalledWith({ force: true, keepLocalData: false }));
  });

  it('opens the preview after Home data is ready without waiting for unrelated stores', async () => {
    mock.demoMode = true;
    mock.waitForLocalStateHydration.mockImplementation(() => new Promise(() => undefined));

    await useAuthStore.getState().hydrateSession();

    expect(useAuthStore.getState().isHydratingSession).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mock.syncRemoteState).not.toHaveBeenCalled();
  });
});
