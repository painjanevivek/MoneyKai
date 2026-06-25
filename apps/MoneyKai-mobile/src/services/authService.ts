import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { ensureFirebaseApp, isFirebaseConfigured, requireFirebaseConfigured } from '@/firebase/firebaseConfig';
import {
  assertAuthAttemptAllowed,
  clearAuthRateLimit,
  consumeAuthAttempt,
  recordFailedAuthAttempt,
} from '@/services/authRateLimit';
import {
  createUserWithEmailGateway,
  exchangeGoogleOAuthCodeGateway,
  requestPasswordResetGateway,
  signInWithEmailGateway,
} from '@/services/authGateway';

export type NativeFirebaseUser = FirebaseAuthTypes.User;
export { isFirebaseConfigured };

const getAuth = async () => {
  requireFirebaseConfigured();
  await ensureFirebaseApp();
  return auth();
};

export const getCurrentFirebaseUser = (): NativeFirebaseUser | null => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  try {
    return auth().currentUser;
  } catch {
    return null;
  }
};

export const getCurrentFirebaseIdToken = async (): Promise<string> => {
  const currentUser = getCurrentFirebaseUser();
  if (!currentUser) {
    throw new Error('You need to be signed in to call the backend.');
  }

  return currentUser.getIdToken();
};

export const waitForAuthState = (): Promise<NativeFirebaseUser | null> => {
  if (!isFirebaseConfigured()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    void ensureFirebaseApp()
      .then((ready) => {
        if (!ready) {
          resolve(null);
          return;
        }

        const unsubscribe = auth().onAuthStateChanged((user) => {
          unsubscribe();
          resolve(user);
        });
      })
      .catch(reject);
  });
};

export const signInWithEmail = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  await assertAuthAttemptAllowed('sign-in', normalizedEmail);

  try {
    const gatewayResponse = await signInWithEmailGateway(normalizedEmail, password);
    const credentials = await (await getAuth()).signInWithCustomToken(gatewayResponse.customToken);
    await clearAuthRateLimit('sign-in', normalizedEmail);
    return credentials;
  } catch (error) {
    await recordFailedAuthAttempt('sign-in', normalizedEmail);
    throw error;
  }
};

export const createUserWithEmail = async (email: string, password: string, displayName: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  await consumeAuthAttempt('sign-up', normalizedEmail);
  const gatewayResponse = await createUserWithEmailGateway(normalizedEmail, password, displayName);
  return (await getAuth()).signInWithCustomToken(gatewayResponse.customToken);
};

export const updateFirebaseUserProfile = async (
  user: NativeFirebaseUser,
  updates: FirebaseAuthTypes.UpdateProfile
) => user.updateProfile(updates);

export const requestPasswordResetEmail = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  await consumeAuthAttempt('password-reset', normalizedEmail);
  return requestPasswordResetGateway(normalizedEmail);
};

export const signInWithGoogleOAuthCode = async (code: string) => {
  const gatewayResponse = await exchangeGoogleOAuthCodeGateway(code);
  return (await getAuth()).signInWithCustomToken(gatewayResponse.customToken);
};

export const signOutFromFirebase = async () => {
  if (!isFirebaseConfigured()) {
    return;
  }

  await ensureFirebaseApp();
  await auth().signOut();
};
