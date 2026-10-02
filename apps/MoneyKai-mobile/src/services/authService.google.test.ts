import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  ensure: vi.fn(), configured: vi.fn(), credential: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), clear: vi.fn(),
}));
vi.mock('@react-native-firebase/auth', () => ({ default: Object.assign(
  () => ({ signInWithCredential: mocks.signIn, signOut: mocks.signOut }),
  { GoogleAuthProvider: { credential: mocks.credential } },
) }));
vi.mock('@/firebase/firebaseConfig', () => ({ ensureFirebaseApp: mocks.ensure, isFirebaseConfigured: mocks.configured, requireFirebaseConfigured: vi.fn() }));
vi.mock('@/services/authRateLimit', () => ({ assertAuthAttemptAllowed: vi.fn(), clearAuthRateLimit: vi.fn(), consumeAuthAttempt: vi.fn(), recordFailedAuthAttempt: vi.fn() }));
vi.mock('@/services/authGateway', () => ({ createUserWithEmailGateway: vi.fn(), exchangeGoogleOAuthCodeGateway: vi.fn(), requestPasswordResetGateway: vi.fn(), signInWithEmailGateway: vi.fn() }));
vi.mock('@/services/nativeGoogleSignIn', () => ({ clearNativeGoogleSession: mocks.clear }));
import { signInWithGoogleIdToken, signOutFromFirebase } from './authService';

describe('Firebase Google credentials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.configured.mockReturnValue(true);
    mocks.ensure.mockResolvedValue(true);
    mocks.credential.mockReturnValue({ providerId: 'google.com' });
    mocks.signIn.mockResolvedValue({ user: { uid: 'existing-firebase-owner' } });
  });
  it('exchanges the native ID token with Firebase rather than trusting client profile data', async () => {
    expect(await signInWithGoogleIdToken('synthetic-token')).toEqual({ user: { uid: 'existing-firebase-owner' } });
    expect(mocks.credential).toHaveBeenCalledWith('synthetic-token');
    expect(mocks.signIn).toHaveBeenCalledWith({ providerId: 'google.com' });
  });
  it('does not create a session when Firebase rejects a credential', async () => {
    mocks.signIn.mockRejectedValueOnce(new Error('rejected'));
    await expect(signInWithGoogleIdToken('synthetic-token')).rejects.toThrow('rejected');
  });
  it('signs out of Firebase and clears the provider selection state', async () => {
    await signOutFromFirebase();
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.clear).toHaveBeenCalledOnce();
  });
});
