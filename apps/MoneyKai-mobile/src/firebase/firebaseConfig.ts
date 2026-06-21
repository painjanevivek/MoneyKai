import firebase from '@react-native-firebase/app';
import {
  appEnvironment,
  hasFirebaseEnvironment,
  hasFirebaseRuntimeConfig as hasFirebaseRuntimeEnvironment,
  hasFirebaseWebAppIdOnly,
} from '@/config/environment';

export const nativeFirebaseConfig = appEnvironment.firebase;
let environmentAppInit: Promise<void> | null = null;

const getEnvironmentFirebaseOptions = () => ({
  apiKey: nativeFirebaseConfig.apiKey,
  authDomain: nativeFirebaseConfig.authDomain,
  projectId: nativeFirebaseConfig.projectId,
  storageBucket: nativeFirebaseConfig.storageBucket,
  messagingSenderId: nativeFirebaseConfig.messagingSenderId,
  appId: nativeFirebaseConfig.appId,
  databaseURL: `https://${nativeFirebaseConfig.projectId}-default-rtdb.firebaseio.com`,
});

const hasNativeFirebaseApp = (): boolean => {
  try {
    const app = firebase.apps[0] ?? firebase.app();
    const options = app.options;
    return Boolean(options.projectId || options.appId || options.apiKey);
  } catch {
    return false;
  }
};

export const isFirebaseConfigured = (): boolean => hasFirebaseRuntimeEnvironment() || hasNativeFirebaseApp();

export const hasFirebaseRuntimeConfig = (): boolean => hasFirebaseRuntimeEnvironment();

export const getFirebaseConfigStatus = (): 'native-ready' | 'web-app-id-only' | 'missing' => {
  if (hasFirebaseEnvironment() || hasNativeFirebaseApp()) {
    return 'native-ready';
  }

  if (hasFirebaseWebAppIdOnly()) {
    return 'web-app-id-only';
  }

  return 'missing';
};

export const ensureFirebaseApp = async (): Promise<boolean> => {
  if (hasNativeFirebaseApp()) {
    return true;
  }

  if (!hasFirebaseRuntimeEnvironment()) {
    return false;
  }

  if (!environmentAppInit) {
    environmentAppInit = firebase
      .initializeApp(getEnvironmentFirebaseOptions())
      .then(() => undefined)
      .catch((error) => {
        environmentAppInit = null;
        throw error;
      });
  }

  await environmentAppInit;
  return hasNativeFirebaseApp();
};

export const requireFirebaseConfigured = () => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Add Firebase runtime keys or android/app/google-services.json before using cloud auth or sync.'
    );
  }
};
