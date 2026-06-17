import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { appEnvironment, hasGoogleClientIds } from '@/config/environment';
import { getNativeGoogleWebClientId } from './nativeCaptureBridge';

let configuredWebClientId: string | undefined;

const resolveGoogleWebClientId = async (): Promise<string> => {
  const nativeWebClientId = await getNativeGoogleWebClientId();
  return nativeWebClientId || appEnvironment.google.webClientId;
};

const ensureGoogleSigninConfigured = async () => {
  const webClientId = await resolveGoogleWebClientId();
  if (configuredWebClientId === webClientId) {
    return;
  }

  GoogleSignin.configure({
    webClientId,
    iosClientId: appEnvironment.google.iosClientId || undefined,
    offlineAccess: false,
  });
  configuredWebClientId = webClientId;
};

const getGoogleSignInErrorCode = (error: unknown): string | undefined =>
  typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : undefined;

export const signInWithGoogleAsync = async (): Promise<FirebaseAuthTypes.User> => {
  if (!hasGoogleClientIds(Platform.OS)) {
    throw new Error(
      'Google sign-in is not configured yet. Add the EXPO_PUBLIC_GOOGLE_* client IDs to .env to enable it on mobile.'
    );
  }

  await ensureGoogleSigninConfigured();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  try {
    const result = await GoogleSignin.signIn();
    if (result.type !== 'success' || !result.data.idToken) {
      throw new Error('Google sign-in was cancelled or did not return an ID token.');
    }

    const credential = auth.GoogleAuthProvider.credential(result.data.idToken);
    const credentials = await auth().signInWithCredential(credential);
    return credentials.user;
  } catch (error) {
    if (getGoogleSignInErrorCode(error) === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Google sign-in was cancelled.');
    }
    throw error;
  }
};
