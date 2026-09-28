import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  changeEmailPasswordFirebase,
  createUserWithEmailFirebase,
  requestPasswordResetEmailFirebase,
  signInWithEmailFirebase,
} from './firebaseEmailAuth';

const authMocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  credential: vi.fn(),
  reauthenticateWithCredential: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
  firebaseAuth: {
    currentUser: null as { email: string } | null,
  },
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: authMocks.createUserWithEmailAndPassword,
  EmailAuthProvider: { credential: authMocks.credential },
  reauthenticateWithCredential: authMocks.reauthenticateWithCredential,
  sendPasswordResetEmail: authMocks.sendPasswordResetEmail,
  signInWithEmailAndPassword: authMocks.signInWithEmailAndPassword,
  updatePassword: authMocks.updatePassword,
  updateProfile: authMocks.updateProfile,
}));

vi.mock('@/services/firebase', () => ({ firebaseAuth: authMocks.firebaseAuth }));

describe('Firebase email authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.firebaseAuth.currentUser = null;
  });

  it('signs in through the Firebase web SDK without a backend email route', async () => {
    const credentials = { user: { uid: 'user-1' } };
    authMocks.signInWithEmailAndPassword.mockResolvedValue(credentials);

    await expect(signInWithEmailFirebase('  Person@Example.com ', 'password')).resolves.toBe(credentials);
    expect(authMocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      authMocks.firebaseAuth,
      'person@example.com',
      'password',
    );
  });

  it('creates the Firebase account and stores the trimmed display name', async () => {
    const credentials = { user: { uid: 'user-2' } };
    authMocks.createUserWithEmailAndPassword.mockResolvedValue(credentials);
    authMocks.updateProfile.mockResolvedValue(undefined);

    await expect(createUserWithEmailFirebase('NEW@Example.com', 'password', '  Money Kai  ')).resolves.toBe(
      credentials,
    );
    expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      authMocks.firebaseAuth,
      'new@example.com',
      'password',
    );
    expect(authMocks.updateProfile).toHaveBeenCalledWith(credentials.user, { displayName: 'Money Kai' });
  });

  it('sends password reset email through Firebase directly', async () => {
    authMocks.sendPasswordResetEmail.mockResolvedValue(undefined);

    await requestPasswordResetEmailFirebase(' PERSON@Example.com ');

    expect(authMocks.sendPasswordResetEmail).toHaveBeenCalledWith(
      authMocks.firebaseAuth,
      'person@example.com',
    );
  });

  it('reauthenticates the signed-in email user before changing the password', async () => {
    const user = { email: 'person@example.com' };
    const credential = { providerId: 'password' };
    authMocks.firebaseAuth.currentUser = user;
    authMocks.credential.mockReturnValue(credential);
    authMocks.reauthenticateWithCredential.mockResolvedValue({ user });
    authMocks.updatePassword.mockResolvedValue(undefined);

    await changeEmailPasswordFirebase('Person@Example.com', 'current-password', 'new-password');

    expect(authMocks.credential).toHaveBeenCalledWith('person@example.com', 'current-password');
    expect(authMocks.reauthenticateWithCredential).toHaveBeenCalledWith(user, credential);
    expect(authMocks.updatePassword).toHaveBeenCalledWith(user, 'new-password');
  });
});
