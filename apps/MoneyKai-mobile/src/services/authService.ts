import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { ensureFirebaseApp, isFirebaseConfigured, requireFirebaseConfigured } from '@/firebase/firebaseConfig';

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

export const signInWithEmail = async (email: string, password: string) =>
  (await getAuth()).signInWithEmailAndPassword(email, password);

export const createUserWithEmail = async (email: string, password: string) =>
  (await getAuth()).createUserWithEmailAndPassword(email, password);

export const updateFirebaseUserProfile = async (
  user: NativeFirebaseUser,
  updates: FirebaseAuthTypes.UpdateProfile
) => user.updateProfile(updates);

export const sendFirebasePasswordResetEmail = async (email: string) =>
  (await getAuth()).sendPasswordResetEmail(email);

export const signOutFromFirebase = async () => {
  if (!isFirebaseConfigured()) {
    return;
  }

  await ensureFirebaseApp();
  await auth().signOut();
};
