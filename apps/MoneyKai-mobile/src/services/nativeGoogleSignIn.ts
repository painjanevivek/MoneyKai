import { NativeModules, Platform } from 'react-native';
import { bundledGoogleWebClientId } from '@/config/googleOAuthClient';

type GoogleSignInModule = {
  signIn(webClientId: string): Promise<string>;
  clearSession(): Promise<void>;
};

export const isGoogleSignInCancelled = (error: unknown): boolean =>
  typeof error === 'object' && error !== null &&
  'code' in error && error.code === 'GOOGLE_SIGN_IN_CANCELLED';

export const requestNativeGoogleIdToken = async (): Promise<string> => {
  const native = NativeModules.MoneyKaiGoogleSignIn as GoogleSignInModule | undefined;
  if (Platform.OS !== 'android' || !native?.signIn) {
    throw new Error('Native Google sign-in is unavailable. Please update MoneyKai or use email login.');
  }
  const token = await native.signIn(bundledGoogleWebClientId);
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('Google did not return a sign-in credential. Please try again.');
  }
  // Credential stays in this attempt's memory; Firebase verifies it server-side.
  return token;
};

export const clearNativeGoogleSession = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  const native = NativeModules.MoneyKaiGoogleSignIn as GoogleSignInModule | undefined;
  try {
    await native?.clearSession();
  } catch {
    // Clearing the provider's selection state must not prevent Firebase logout.
  }
};
