import { NativeModules, Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';

type DeviceCredentialBridge = {
  isDeviceSecure(): Promise<boolean>;
  confirmDeviceCredential(): Promise<boolean>;
  setSplashAppLockEnabled(enabled: boolean): Promise<void>;
  consumeSplashAppLockResult(): Promise<'none' | 'verified' | 'cancelled'>;
};

const credentialBridge = NativeModules.MoneyKaiDeviceCredential as DeviceCredentialBridge | undefined;
const biometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
let lastVerifiedAt = 0;
let authenticationInProgress = false;

export const wasDeviceOwnerJustVerified = () => Date.now() - lastVerifiedAt < 10_000;
export const isDeviceAuthenticationInProgress = () => authenticationInProgress;
export const clearDeviceOwnerVerification = () => { lastVerifiedAt = 0; };

export const syncSplashAppLockEnabled = async (enabled: boolean): Promise<void> => {
  await credentialBridge?.setSplashAppLockEnabled(enabled);
};

export const consumeSplashAppLockResult = async (): Promise<'none' | 'verified' | 'cancelled'> =>
  credentialBridge?.consumeSplashAppLockResult() ?? 'none';

export async function canAuthenticateDeviceOwner(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const biometricStatus = await biometrics.isSensorAvailable().catch(() => ({ available: false }));
    return biometricStatus.available || Boolean(await credentialBridge?.isDeviceSecure());
  }
  return (await biometrics.isSensorAvailable()).available;
}

export async function authenticateDeviceOwner(promptMessage: string, useCredential = false): Promise<boolean> {
  if (authenticationInProgress) return false;
  authenticationInProgress = true;
  try {
    let verified = false;
    if (Platform.OS === 'android' && Platform.Version < 30) {
      const status = await biometrics.isSensorAvailable();
      if (!useCredential && status.available) {
        verified = (await biometrics.simplePrompt({ promptMessage })).success;
      } else if (credentialBridge && await credentialBridge.isDeviceSecure()) {
        verified = Boolean(await credentialBridge.confirmDeviceCredential());
      }
    } else if (Platform.OS === 'android' && !(await biometrics.isSensorAvailable()).available && credentialBridge && await credentialBridge.isDeviceSecure()) {
      verified = Boolean(await credentialBridge.confirmDeviceCredential());
    } else {
      verified = (await biometrics.simplePrompt({ promptMessage })).success;
    }
    if (verified) lastVerifiedAt = Date.now();
    return verified;
  } finally {
    authenticationInProgress = false;
  }
}
