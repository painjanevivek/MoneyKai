import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getWebAuthDomain } from '@/config/firebaseAuthWeb';

const PLACEHOLDER_PATTERNS = [
  'placeholder',
  'REPLACE_ME',
  'your-project',
  'your-api-key',
];

const isRealValue = (value: string): boolean =>
  value.length > 0 && !PLACEHOLDER_PATTERNS.some((pattern) => value.includes(pattern));

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

const fallbackConfig = {
  apiKey: 'placeholder-api-key',
  authDomain: 'placeholder.firebaseapp.com',
  projectId: 'placeholder-project',
  storageBucket: 'placeholder.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:placeholder',
};

const getRuntimeAuthDomain = (configuredAuthDomain: string): string => {
  if (typeof window === 'undefined') {
    return configuredAuthDomain;
  }

  return getWebAuthDomain(configuredAuthDomain, window.location.hostname);
};

const normalizedConfig = {
  apiKey: isRealValue(firebaseConfig.apiKey) ? firebaseConfig.apiKey : fallbackConfig.apiKey,
  authDomain: isRealValue(firebaseConfig.authDomain) ? getRuntimeAuthDomain(firebaseConfig.authDomain) : fallbackConfig.authDomain,
  projectId: isRealValue(firebaseConfig.projectId) ? firebaseConfig.projectId : fallbackConfig.projectId,
  storageBucket: isRealValue(firebaseConfig.storageBucket) ? firebaseConfig.storageBucket : fallbackConfig.storageBucket,
  messagingSenderId: isRealValue(firebaseConfig.messagingSenderId) ? firebaseConfig.messagingSenderId : fallbackConfig.messagingSenderId,
  appId: isRealValue(firebaseConfig.appId) ? firebaseConfig.appId : fallbackConfig.appId,
};

export const isFirebaseConfigured = (): boolean =>
  isRealValue(firebaseConfig.apiKey) &&
  isRealValue(firebaseConfig.authDomain) &&
  isRealValue(firebaseConfig.projectId) &&
  isRealValue(firebaseConfig.storageBucket) &&
  isRealValue(firebaseConfig.messagingSenderId) &&
  isRealValue(firebaseConfig.appId);

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(normalizedConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);

export const waitForAuthState = (): Promise<User | null> =>
  new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
