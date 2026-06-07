import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { appEnvironment, hasFirebaseEnvironment } from '@/config/environment';

export const isFirebaseConfigured = (): boolean =>
  hasFirebaseEnvironment();

const firebaseApp = getApps().length > 0
  ? getApp()
  : initializeApp(
      hasFirebaseEnvironment()
        ? appEnvironment.firebase
        : {
            apiKey: 'placeholder-api-key',
            authDomain: 'placeholder.firebaseapp.com',
            projectId: 'placeholder-project',
            storageBucket: 'placeholder.appspot.com',
            messagingSenderId: '000000000000',
            appId: '1:000000000000:web:placeholder',
          }
    );
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);

export const waitForAuthState = (): Promise<User | null> =>
  new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
