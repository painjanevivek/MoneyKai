import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential, type User } from 'firebase/auth';
import { Platform } from 'react-native';
import { firebaseAuth } from './firebase';
import { appEnvironment, hasGoogleClientIds } from '@/config/environment';

const GOOGLE_ISSUER = 'https://accounts.google.com';
const APP_SCHEME = 'moneykai-mobile';
const AUTH_REDIRECT_PATH = 'oauthredirect';
const NATIVE_REDIRECT_URI = `${APP_SCHEME}://${AUTH_REDIRECT_PATH}`;

const getRedirectUri = () =>
  AuthSession.makeRedirectUri({
    native: NATIVE_REDIRECT_URI,
    path: AUTH_REDIRECT_PATH,
    scheme: APP_SCHEME,
  });

const buildAuthConfig = () =>
  ({
    clientId:
      Platform.OS === 'ios'
        ? appEnvironment.google.iosClientId || appEnvironment.google.webClientId
        : Platform.OS === 'android'
          ? appEnvironment.google.androidClientId || appEnvironment.google.webClientId
          : appEnvironment.google.webClientId,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'] as string[],
    redirectUri: getRedirectUri(),
    extraParams: {
      prompt: 'select_account',
    },
    webClientId: appEnvironment.google.webClientId || undefined,
    iosClientId: appEnvironment.google.iosClientId || undefined,
    androidClientId: appEnvironment.google.androidClientId || undefined,
  }) as const;

export const signInWithGoogleAsync = async (): Promise<User> => {
  if (!hasGoogleClientIds(Platform.OS)) {
    throw new Error(
      'Google sign-in is not configured yet. Add the EXPO_PUBLIC_GOOGLE_* client IDs to .env to enable it on web and mobile.'
    );
  }

  const discovery = await AuthSession.fetchDiscoveryAsync(GOOGLE_ISSUER);
  const request = await AuthSession.loadAsync(buildAuthConfig(), discovery);
  const result = await request.promptAsync(discovery);

  if (result.type === 'error') {
    throw new Error(result.error?.message || result.params?.error_description || 'Google sign-in failed.');
  }

  const idToken = result.authentication?.idToken ?? result.params?.id_token;

  if (result.type !== 'success' || !idToken) {
    throw new Error('Google sign-in was cancelled or did not return an ID token.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const credentials = await signInWithCredential(firebaseAuth, credential);
  return credentials.user;
};
