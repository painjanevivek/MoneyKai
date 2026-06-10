const PLACEHOLDER_PATTERNS = ['placeholder', 'REPLACE_ME', 'your-project', 'your-api-key'];

const readEnv = (key: string): string => process.env[key]?.trim() ?? '';

const isRealValue = (value: string): boolean =>
  value.length > 0 && !PLACEHOLDER_PATTERNS.some((pattern) => value.includes(pattern));

const firebaseEnv = {
  apiKey: readEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

const googleEnv = {
  webClientId: readEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
  iosClientId: readEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
  androidClientId: readEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
};

const storeReviewEnv = {
  iosUrl: readEnv('EXPO_PUBLIC_APP_STORE_URL'),
  androidUrl: readEnv('EXPO_PUBLIC_PLAY_STORE_URL'),
};

const backendBaseUrl = readEnv('EXPO_PUBLIC_BACKEND_BASE_URL').replace(/\/$/, '');
const isDevRuntime = (): boolean => typeof __DEV__ !== 'undefined' && __DEV__;
const smsResearchBuildValue = readEnv('EXPO_PUBLIC_SMS_RESEARCH_BUILD');

export const appEnvironment = {
  firebase: firebaseEnv,
  google: googleEnv,
  storeReview: storeReviewEnv,
  backendBaseUrl,
  debug: readEnv('EXPO_PUBLIC_DEBUG') === 'true',
  demoMode: readEnv('EXPO_PUBLIC_DEMO_MODE') === 'true',
  smsResearchBuild: smsResearchBuildValue === '' ? true : smsResearchBuildValue === 'true',
  nativeSmsResearchBuild: readEnv('EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD') === 'true',
};

export const hasFirebaseEnvironment = (): boolean =>
  isRealValue(firebaseEnv.apiKey) &&
  isRealValue(firebaseEnv.authDomain) &&
  isRealValue(firebaseEnv.projectId) &&
  isRealValue(firebaseEnv.storageBucket) &&
  isRealValue(firebaseEnv.messagingSenderId) &&
  isRealValue(firebaseEnv.appId);

export const isDemoModeEnabled = (): boolean =>
  isDevRuntime() && (appEnvironment.demoMode || !hasFirebaseEnvironment());

export const isSmsResearchBuildEnabled = (): boolean =>
  appEnvironment.smsResearchBuild;

export const isNativeSmsResearchBuildEnabled = (): boolean =>
  appEnvironment.nativeSmsResearchBuild;

export const getBackendBaseUrl = (): string => {
  if (appEnvironment.backendBaseUrl.length > 0) {
    return appEnvironment.backendBaseUrl;
  }

  return isDevRuntime() ? 'http://localhost:8000' : '';
};

export const hasGoogleClientIds = (): boolean =>
  isRealValue(googleEnv.webClientId) &&
  isRealValue(googleEnv.iosClientId) &&
  isRealValue(googleEnv.androidClientId);

export const getStoreReviewUrl = (platform: 'ios' | 'android'): string => {
  const configuredUrl = platform === 'ios' ? storeReviewEnv.iosUrl : storeReviewEnv.androidUrl;
  if (isRealValue(configuredUrl)) {
    return configuredUrl;
  }

  return platform === 'ios'
    ? 'https://apps.apple.com/search?term=MoneyKai'
    : 'https://play.google.com/store/search?q=MoneyKai&c=apps';
};
