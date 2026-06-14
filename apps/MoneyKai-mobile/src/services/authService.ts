import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { isFirebaseConfigured, requireFirebaseConfigured } from '@/firebase/firebaseConfig';

export type NativeFirebaseUser = FirebaseAuthTypes.User;
export { isFirebaseConfigured };

const getAuth = () => {
  requireFirebaseConfigured();
  return auth();
};

export const getCurrentFirebaseUser = (): NativeFirebaseUser | null => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  return auth().currentUser;
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

  return new Promise((resolve) => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const signInWithEmail = async (email: string, password: string) =>
  getAuth().signInWithEmailAndPassword(email, password);

export const createUserWithEmail = async (email: string, password: string) =>
  getAuth().createUserWithEmailAndPassword(email, password);

export const updateFirebaseUserProfile = async (
  user: NativeFirebaseUser,
  updates: FirebaseAuthTypes.UpdateProfile
) => user.updateProfile(updates);

export const sendFirebasePasswordResetEmail = async (email: string) =>
  getAuth().sendPasswordResetEmail(email);

export const signOutFromFirebase = async () => {
  if (!isFirebaseConfigured()) {
    return;
  }

  await auth().signOut();
};
