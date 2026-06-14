import firebase from '@react-native-firebase/app';
import { appEnvironment, hasFirebaseEnvironment } from '@/config/environment';

export const nativeFirebaseConfig = appEnvironment.firebase;

const hasNativeFirebaseApp = (): boolean => {
  try {
    const app = firebase.apps[0] ?? firebase.app();
    const options = app.options;
    return Boolean(options.projectId || options.appId || options.apiKey);
  } catch {
    return false;
  }
};

export const isFirebaseConfigured = (): boolean => hasFirebaseEnvironment() || hasNativeFirebaseApp();

export const requireFirebaseConfigured = () => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Add android/app/google-services.json before using cloud auth or sync.'
    );
  }
};
