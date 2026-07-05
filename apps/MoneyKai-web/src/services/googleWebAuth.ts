import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from 'firebase/auth';
import { firebaseAuth } from '@/services/firebase';

const createGoogleProvider = (): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
};

export const startGoogleFirebaseRedirect = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('Google sign-in requires a browser window.');
  }

  await signInWithRedirect(firebaseAuth, createGoogleProvider());
};

const shouldFallbackToRedirect = (error: unknown): boolean => {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code).toLowerCase()
    : '';
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  return (
    code.includes('popup-blocked') ||
    code.includes('operation-not-supported-in-this-environment') ||
    message.includes('popup blocked') ||
    message.includes('operation is not supported in this environment')
  );
};

export const signInWithGoogleFirebase = async (): Promise<UserCredential | null> => {
  if (typeof window === 'undefined') {
    throw new Error('Google sign-in requires a browser window.');
  }

  try {
    return await signInWithPopup(firebaseAuth, createGoogleProvider());
  } catch (error) {
    if (!shouldFallbackToRedirect(error)) {
      throw error;
    }

    await startGoogleFirebaseRedirect();
    return null;
  }
};
