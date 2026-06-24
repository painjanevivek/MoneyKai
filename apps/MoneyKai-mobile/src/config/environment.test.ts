import { describe, expect, it, vi } from 'vitest';

type EnvironmentModule = typeof import('./environment');

const trackedEnvKeys = [
  'EXPO_PUBLIC_BACKEND_BASE_URL',
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
  'EXPO_PUBLIC_APP_STORE_URL',
  'EXPO_PUBLIC_PLAY_STORE_URL',
] as const;

const loadEnvironment = async (env: Partial<Record<(typeof trackedEnvKeys)[number], string>>): Promise<EnvironmentModule> => {
  const previousValues = new Map<string, string | undefined>();

  for (const key of trackedEnvKeys) {
    previousValues.set(key, process.env[key]);
    if (env[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  }

  vi.resetModules();
  const environmentModule = await import('./environment');

  for (const [key, value] of previousValues) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  vi.resetModules();
  return environmentModule;
};

describe('app environment', () => {
  it('normalizes a bare deployed backend host to HTTPS', async () => {
    const environment = await loadEnvironment({
      EXPO_PUBLIC_BACKEND_BASE_URL: 'money-kai-backend.vercel.app',
    });

    expect(environment.getBackendBaseUrl()).toBe('https://money-kai-backend.vercel.app');
  });

  it('keeps explicit local backend URLs intact', async () => {
    const environment = await loadEnvironment({
      EXPO_PUBLIC_BACKEND_BASE_URL: 'http://localhost:8000/',
    });

    expect(environment.getBackendBaseUrl()).toBe('http://localhost:8000');
  });

  it('normalizes Firebase placeholders without treating them as real cloud credentials', async () => {
    const environment = await loadEnvironment({
      EXPO_PUBLIC_FIREBASE_API_KEY: '',
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'your-project.firebaseapp.com',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: '',
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: '',
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '',
      EXPO_PUBLIC_FIREBASE_APP_ID: '',
    });

    expect(environment.appEnvironment.firebase.projectId).toBe('placeholder-project');
    expect(environment.appEnvironment.firebase.appId).toBe('1:000000000000:android:placeholder');
    expect(environment.hasFirebaseEnvironment()).toBe(false);
  });

  it('does not treat a web Firebase app id as native Android config', async () => {
    const environment = await loadEnvironment({
      EXPO_PUBLIC_FIREBASE_API_KEY: 'firebase-api-key',
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'moneykai.firebaseapp.com',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'moneykai',
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'moneykai.firebasestorage.app',
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789012',
      EXPO_PUBLIC_FIREBASE_APP_ID: '1:123456789012:web:abcdef123456',
      EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID: '',
    });

    expect(environment.hasFirebaseEnvironment()).toBe(false);
    expect(environment.hasFirebaseRuntimeConfig()).toBe(true);
    expect(environment.hasFirebaseWebAppIdOnly()).toBe(true);
  });

  it('uses the Android Firebase app id when present', async () => {
    const environment = await loadEnvironment({
      EXPO_PUBLIC_FIREBASE_API_KEY: 'firebase-api-key',
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'moneykai.firebaseapp.com',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'moneykai',
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'moneykai.firebasestorage.app',
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789012',
      EXPO_PUBLIC_FIREBASE_APP_ID: '1:123456789012:web:abcdef123456',
      EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID: '1:123456789012:android:abcdef123456',
    });

    expect(environment.appEnvironment.firebase.appId).toBe('1:123456789012:android:abcdef123456');
    expect(environment.hasFirebaseEnvironment()).toBe(true);
  });

  it('treats Android Google sign-in as configured without an iOS client ID', async () => {
    const environment = await loadEnvironment({
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web-client.apps.googleusercontent.com',
      EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: 'android-client.apps.googleusercontent.com',
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: '',
    });

    expect(environment.hasGoogleClientIds('android')).toBe(true);
    expect(environment.hasGoogleClientIds('ios')).toBe(false);
    expect(environment.hasGoogleClientIds()).toBe(true);
  });

  it('uses the web client ID as the Android Google sign-in requirement', async () => {
    const environment = await loadEnvironment({
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web-client.apps.googleusercontent.com',
      EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: '',
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: '',
    });

    expect(environment.hasGoogleClientIds('android')).toBe(true);
    expect(environment.hasGoogleClientIds('ios')).toBe(false);
  });

  it('does not fall back to generic store search URLs when review links are missing', async () => {
    const environment = await loadEnvironment({
      EXPO_PUBLIC_APP_STORE_URL: '',
      EXPO_PUBLIC_PLAY_STORE_URL: '',
    });

    expect(environment.getStoreReviewUrl('ios')).toBeNull();
    expect(environment.getStoreReviewUrl('android')).toBeNull();
    expect(environment.getStoreReviewUrl('web')).toBeNull();
  });

  it('returns configured store review links when they exist', async () => {
    const environment = await loadEnvironment({
      EXPO_PUBLIC_APP_STORE_URL: 'https://apps.apple.com/app/moneykai/id123456789?action=write-review',
      EXPO_PUBLIC_PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.moneykai.app&showAllReviews=true',
    });

    expect(environment.getStoreReviewUrl('ios')).toBe(
      'https://apps.apple.com/app/moneykai/id123456789?action=write-review'
    );
    expect(environment.getStoreReviewUrl('android')).toBe(
      'https://play.google.com/store/apps/details?id=com.moneykai.app&showAllReviews=true'
    );
    expect(environment.getStoreReviewUrl('web')).toBe(
      'https://play.google.com/store/apps/details?id=com.moneykai.app&showAllReviews=true'
    );
  });
});
