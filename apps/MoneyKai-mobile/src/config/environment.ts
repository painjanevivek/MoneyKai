const PLACEHOLDER_PATTERNS = ['placeholder', 'REPLACE_ME', 'your-project', 'your-api-key'];

const isRealValue = (value: string): boolean =>
  value.length > 0 && !PLACEHOLDER_PATTERNS.some((pattern) => value.includes(pattern));

const readEnv = (...keys: string[]): string => {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return '';
};

const readNativeBuildConfig = (): { smsResearchBuild?: boolean; nativeSmsResearchBuild?: boolean } => {
  try {
    // Standalone React Native builds do not reliably carry arbitrary process.env values.
    // The Android app exposes these constants from BuildConfig for local research APKs.
    const reactNative = require('react-native') as {
      NativeModules?: {
        MoneyKaiBuildConfig?: {
          smsResearchBuild?: boolean;
          nativeSmsResearchBuild?: boolean;
        };
      };
    };
    return reactNative.NativeModules?.MoneyKaiBuildConfig ?? {};
  } catch {
    return {};
  }
};

const nativeBuildConfig = readNativeBuildConfig();

const firebaseEnv = {
  apiKey: readEnv('MONEYKAI_FIREBASE_API_KEY', 'EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readEnv('MONEYKAI_FIREBASE_AUTH_DOMAIN', 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('MONEYKAI_FIREBASE_PROJECT_ID', 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('MONEYKAI_FIREBASE_STORAGE_BUCKET', 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('MONEYKAI_FIREBASE_MESSAGING_SENDER_ID', 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('MONEYKAI_FIREBASE_APP_ID', 'EXPO_PUBLIC_FIREBASE_APP_ID'),
};

const googleEnv = {
  webClientId: readEnv('MONEYKAI_GOOGLE_WEB_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
  iosClientId: readEnv('MONEYKAI_GOOGLE_IOS_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
  androidClientId: readEnv('MONEYKAI_GOOGLE_ANDROID_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
};

const storeReviewEnv = {
  iosUrl: readEnv('MONEYKAI_APP_STORE_URL', 'EXPO_PUBLIC_APP_STORE_URL'),
  androidUrl: readEnv('MONEYKAI_PLAY_STORE_URL', 'EXPO_PUBLIC_PLAY_STORE_URL'),
};

const normalizeBackendBaseUrl = (value: string): string => {
  const trimmedValue = value.trim().replace(/\/$/, '');
  if (trimmedValue.length === 0) {
    return '';
  }

  return /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;
};

const backendBaseUrl = normalizeBackendBaseUrl(readEnv('MONEYKAI_BACKEND_BASE_URL', 'EXPO_PUBLIC_BACKEND_BASE_URL'));
const isDevRuntime = (): boolean => typeof __DEV__ !== 'undefined' && __DEV__;
const smsResearchBuildValue = readEnv('EXPO_PUBLIC_SMS_RESEARCH_BUILD');
const gmailSyncEnabledValue = readEnv('EXPO_PUBLIC_GMAIL_SYNC_ENABLED');
const pdfStatementParsingEnabledValue = readEnv('EXPO_PUBLIC_PDF_STATEMENT_PARSING_ENABLED');
const wealthTabEnabledValue = readEnv('EXPO_PUBLIC_WEALTH_TAB_ENABLED');
const financialAiEnabledValue = readEnv('EXPO_PUBLIC_FINANCIAL_AI_ENABLED');

export const appEnvironment = {
  firebase: firebaseEnv,
  google: googleEnv,
  storeReview: storeReviewEnv,
  backendBaseUrl,
  debug: readEnv('EXPO_PUBLIC_DEBUG') === 'true',
  demoMode: readEnv('EXPO_PUBLIC_DEMO_MODE') === 'true',
  smsResearchBuild: smsResearchBuildValue === '' ? true : smsResearchBuildValue === 'true',
  nativeSmsResearchBuild: readEnv('EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD') === 'true',
  gmailSyncEnabled: gmailSyncEnabledValue === 'true',
  pdfStatementParsingEnabled: pdfStatementParsingEnabledValue === 'true',
  wealthTabEnabled: wealthTabEnabledValue === 'true',
  financialAiEnabled: financialAiEnabledValue === 'true',
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

export const isGmailSyncEnabled = (): boolean =>
  appEnvironment.gmailSyncEnabled;

export const isPdfStatementParsingEnabled = (): boolean =>
  appEnvironment.pdfStatementParsingEnabled;

export const isWealthTabEnabled = (): boolean =>
  appEnvironment.wealthTabEnabled;

export const isFinancialAiEnabled = (): boolean =>
  appEnvironment.financialAiEnabled;

export const getBackendBaseUrl = (): string => {
  if (appEnvironment.backendBaseUrl.length > 0) {
    return appEnvironment.backendBaseUrl;
  }

  return isDevRuntime() ? 'http://localhost:8000' : '';
};

type GoogleClientPlatform = 'android' | 'ios' | 'web';

export const hasGoogleClientIds = (platform?: GoogleClientPlatform): boolean => {
  const hasWebClientId = isRealValue(googleEnv.webClientId);
  if (!hasWebClientId) {
    return false;
  }

  if (platform === 'android') {
    return true;
  }

  if (platform === 'ios') {
    return isRealValue(googleEnv.iosClientId);
  }

  if (platform === 'web') {
    return true;
  }

  return true;
};

export const getStoreReviewUrl = (platform: 'ios' | 'android'): string => {
  const configuredUrl = platform === 'ios' ? storeReviewEnv.iosUrl : storeReviewEnv.androidUrl;
  if (isRealValue(configuredUrl)) {
    return configuredUrl;
  }

  return platform === 'ios'
    ? 'https://apps.apple.com/search?term=MoneyKai'
    : 'https://play.google.com/store/search?q=MoneyKai&c=apps';
};
