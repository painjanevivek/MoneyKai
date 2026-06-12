import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { appEnvironment, hasGoogleClientIds } from '@/config/environment';
import type { NativeFirebaseUser } from './authService';

let configured = false;

const configureGoogleSignIn = () => {
  if (configured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: appEnvironment.google.webClientId || undefined,
    iosClientId: appEnvironment.google.iosClientId || undefined,
    offlineAccess: false,
  });
  configured = true;
};

const getGoogleClientPlatform = () =>
  Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : 'web';

const readIdToken = (response: unknown): string | undefined => {
  if (!response || typeof response !== 'object') {
    return undefined;
  }

  if ('idToken' in response && typeof response.idToken === 'string') {
    return response.idToken;
  }

  if ('data' in response && response.data && typeof response.data === 'object') {
    const data = response.data as { idToken?: unknown };
    return typeof data.idToken === 'string' ? data.idToken : undefined;
  }

  return undefined;
};

export const signInWithGoogleAsync = async (): Promise<NativeFirebaseUser> => {
  if (!hasGoogleClientIds(getGoogleClientPlatform())) {
    throw new Error(
      'Google sign-in is not configured yet. Add the required MONEYKAI_GOOGLE_* client IDs to .env and Firebase Console to enable it on this platform.'
    );
  }

  configureGoogleSignIn();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();
  const idToken = readIdToken(response);
  if (!idToken) {
    throw new Error('Google sign-in was cancelled or did not return an ID token.');
  }

  const credential = auth.GoogleAuthProvider.credential(idToken);
  const credentials = await auth().signInWithCredential(credential);
  return credentials.user;
};
