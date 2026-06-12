import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { appEnvironment } from '@/config/environment';
import { bundledGoogleWebClientId } from '@/config/googleOAuthClient';
import { getNativeGoogleWebClientId } from './nativeCaptureBridge';
import type { NativeFirebaseUser } from './authService';

let configured = false;

const getGoogleWebClientId = async (): Promise<string> => {
  if (appEnvironment.google.webClientId) {
    return appEnvironment.google.webClientId;
  }

  if (bundledGoogleWebClientId) {
    return bundledGoogleWebClientId;
  }

  if (Platform.OS === 'android') {
    return getNativeGoogleWebClientId();
  }

  return '';
};

const configureGoogleSignIn = async () => {
  if (configured) {
    return;
  }

  const webClientId = await getGoogleWebClientId();
  GoogleSignin.configure({
    webClientId: webClientId || undefined,
    iosClientId: appEnvironment.google.iosClientId || undefined,
    offlineAccess: false,
  });
  configured = true;
};

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
  const webClientId = await getGoogleWebClientId();
  const hasPlatformClientId = Platform.OS !== 'ios' || Boolean(appEnvironment.google.iosClientId);
  if (!webClientId || !hasPlatformClientId) {
    throw new Error(
      'Google sign-in is not configured yet. Add a Web OAuth client to Firebase, download the latest android/app/google-services.json, and add SHA fingerprints in Firebase Console.'
    );
  }

  await configureGoogleSignIn();

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
