import { appEnvironment, hasFirebaseEnvironment } from '@/config/environment';

export const nativeFirebaseConfig = appEnvironment.firebase;

export const isFirebaseConfigured = (): boolean => hasFirebaseEnvironment();

export const requireFirebaseConfigured = () => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Add android/app/google-services.json and set the MONEYKAI_FIREBASE_* values before using cloud auth or sync.'
    );
  }
};
