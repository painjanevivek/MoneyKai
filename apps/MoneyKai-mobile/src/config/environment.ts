const PLACEHOLDER_PATTERNS = ['placeholder', 'REPLACE_ME', 'your-project', 'your-api-key'];

const publicEnv: Record<string, string | undefined> = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  EXPO_PUBLIC_APP_STORE_URL: process.env.EXPO_PUBLIC_APP_STORE_URL,
  EXPO_PUBLIC_PLAY_STORE_URL: process.env.EXPO_PUBLIC_PLAY_STORE_URL,
  EXPO_PUBLIC_BACKEND_BASE_URL: process.env.EXPO_PUBLIC_BACKEND_BASE_URL,
  EXPO_PUBLIC_SMS_RESEARCH_BUILD: process.env.EXPO_PUBLIC_SMS_RESEARCH_BUILD,
  EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD: process.env.EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD,
  EXPO_PUBLIC_GMAIL_SYNC_ENABLED: process.env.EXPO_PUBLIC_GMAIL_SYNC_ENABLED,
  EXPO_PUBLIC_PDF_STATEMENT_PARSING_ENABLED: process.env.EXPO_PUBLIC_PDF_STATEMENT_PARSING_ENABLED,
  EXPO_PUBLIC_WEALTH_TAB_ENABLED: process.env.EXPO_PUBLIC_WEALTH_TAB_ENABLED,
  EXPO_PUBLIC_FINANCIAL_AI_ENABLED: process.env.EXPO_PUBLIC_FINANCIAL_AI_ENABLED,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  EXPO_PUBLIC_SENTRY_ENVIRONMENT: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT,
  EXPO_PUBLIC_SENTRY_RELEASE: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
  EXPO_PUBLIC_SENTRY_DIST: process.env.EXPO_PUBLIC_SENTRY_DIST,
  EXPO_PUBLIC_SENTRY_ENABLED: process.env.EXPO_PUBLIC_SENTRY_ENABLED,
  EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  EXPO_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE: process.env.EXPO_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE,
  EXPO_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE: process.env.EXPO_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE,
  EXPO_PUBLIC_SENTRY_REPLAY_ERROR_SAMPLE_RATE: process.env.EXPO_PUBLIC_SENTRY_REPLAY_ERROR_SAMPLE_RATE,
  EXPO_PUBLIC_SENTRY_ERROR_SAMPLE_RATE: process.env.EXPO_PUBLIC_SENTRY_ERROR_SAMPLE_RATE,
  EXPO_PUBLIC_DEBUG: process.env.EXPO_PUBLIC_DEBUG,
  EXPO_PUBLIC_DEMO_MODE: process.env.EXPO_PUBLIC_DEMO_MODE,
};

const readPublicEnv = (key: keyof typeof publicEnv): string => publicEnv[key]?.trim() ?? '';

const isRealValue = (value: string): boolean =>
  value.length > 0 && !PLACEHOLDER_PATTERNS.some((pattern) => value.includes(pattern));

const firebaseEnv = {
  apiKey: readPublicEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readPublicEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readPublicEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readPublicEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readPublicEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readPublicEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
  androidAppId: readPublicEnv('EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID'),
};

const fallbackFirebaseEnv = {
  apiKey: 'placeholder-api-key',
  authDomain: 'placeholder.firebaseapp.com',
  projectId: 'placeholder-project',
  storageBucket: 'placeholder.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:android:placeholder',
};

const normalizedFirebaseEnv = {
  apiKey: isRealValue(firebaseEnv.apiKey) ? firebaseEnv.apiKey : fallbackFirebaseEnv.apiKey,
  authDomain: isRealValue(firebaseEnv.authDomain) ? firebaseEnv.authDomain : fallbackFirebaseEnv.authDomain,
  projectId: isRealValue(firebaseEnv.projectId) ? firebaseEnv.projectId : fallbackFirebaseEnv.projectId,
  storageBucket: isRealValue(firebaseEnv.storageBucket) ? firebaseEnv.storageBucket : fallbackFirebaseEnv.storageBucket,
  messagingSenderId: isRealValue(firebaseEnv.messagingSenderId)
    ? firebaseEnv.messagingSenderId
    : fallbackFirebaseEnv.messagingSenderId,
  appId: isRealValue(firebaseEnv.androidAppId)
    ? firebaseEnv.androidAppId
    : isRealValue(firebaseEnv.appId) && firebaseEnv.appId.includes(':android:')
      ? firebaseEnv.appId
      : isRealValue(firebaseEnv.appId)
        ? firebaseEnv.appId
      : fallbackFirebaseEnv.appId,
};

const googleEnv = {
  webClientId: readPublicEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
  iosClientId: readPublicEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
  androidClientId: readPublicEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
};

const storeReviewEnv = {
  iosUrl: readPublicEnv('EXPO_PUBLIC_APP_STORE_URL'),
  androidUrl: readPublicEnv('EXPO_PUBLIC_PLAY_STORE_URL'),
};

const normalizeBackendBaseUrl = (value: string): string => {
  const trimmed = value.trim().replace(/\/$/, '');
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const backendBaseUrl = normalizeBackendBaseUrl(readPublicEnv('EXPO_PUBLIC_BACKEND_BASE_URL'));
const isDevRuntime = (): boolean => typeof __DEV__ !== 'undefined' && __DEV__;
const smsResearchBuildValue = readPublicEnv('EXPO_PUBLIC_SMS_RESEARCH_BUILD');
const nativeSmsResearchBuildValue = readPublicEnv('EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD');
const gmailSyncEnabledValue = readPublicEnv('EXPO_PUBLIC_GMAIL_SYNC_ENABLED');
const pdfStatementParsingEnabledValue = readPublicEnv('EXPO_PUBLIC_PDF_STATEMENT_PARSING_ENABLED');
const wealthTabEnabledValue = readPublicEnv('EXPO_PUBLIC_WEALTH_TAB_ENABLED');
const financialAiEnabledValue = readPublicEnv('EXPO_PUBLIC_FINANCIAL_AI_ENABLED');
const DEFAULT_PRODUCTION_BACKEND_BASE_URL = 'https://money-kai-backend.vercel.app';

const sentryEnv = {
  dsn: readPublicEnv('EXPO_PUBLIC_SENTRY_DSN'),
  environment: readPublicEnv('EXPO_PUBLIC_SENTRY_ENVIRONMENT'),
  release: readPublicEnv('EXPO_PUBLIC_SENTRY_RELEASE'),
  dist: readPublicEnv('EXPO_PUBLIC_SENTRY_DIST'),
  enabled: readPublicEnv('EXPO_PUBLIC_SENTRY_ENABLED'),
  tracesSampleRate: readPublicEnv('EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE'),
  profilesSampleRate: readPublicEnv('EXPO_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE'),
  replaySessionSampleRate: readPublicEnv('EXPO_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE'),
  replayErrorSampleRate: readPublicEnv('EXPO_PUBLIC_SENTRY_REPLAY_ERROR_SAMPLE_RATE'),
  errorSampleRate: readPublicEnv('EXPO_PUBLIC_SENTRY_ERROR_SAMPLE_RATE'),
};

export const appEnvironment = {
  firebase: normalizedFirebaseEnv,
  firebaseSource: firebaseEnv,
  google: googleEnv,
  storeReview: storeReviewEnv,
  backendBaseUrl,
  debug: readPublicEnv('EXPO_PUBLIC_DEBUG') === 'true',
  demoMode: readPublicEnv('EXPO_PUBLIC_DEMO_MODE') === 'true',
  smsResearchBuild: smsResearchBuildValue === 'true',
  nativeSmsResearchBuild: nativeSmsResearchBuildValue === 'true',
  gmailSyncEnabled: gmailSyncEnabledValue === 'true',
  pdfStatementParsingEnabled: pdfStatementParsingEnabledValue === 'true',
  wealthTabEnabled: wealthTabEnabledValue === '' ? true : wealthTabEnabledValue === 'true',
  financialAiEnabled: financialAiEnabledValue === 'true',
  sentry: sentryEnv,
};

export const hasFirebaseEnvironment = (): boolean =>
  isRealValue(firebaseEnv.apiKey) &&
  isRealValue(firebaseEnv.authDomain) &&
  isRealValue(firebaseEnv.projectId) &&
  isRealValue(firebaseEnv.storageBucket) &&
  isRealValue(firebaseEnv.messagingSenderId) &&
  isRealValue(normalizedFirebaseEnv.appId) &&
  normalizedFirebaseEnv.appId.includes(':android:');

export const hasFirebaseRuntimeConfig = (): boolean =>
  isRealValue(firebaseEnv.apiKey) &&
  isRealValue(firebaseEnv.authDomain) &&
  isRealValue(firebaseEnv.projectId) &&
  isRealValue(firebaseEnv.storageBucket) &&
  isRealValue(firebaseEnv.messagingSenderId) &&
  (isRealValue(firebaseEnv.androidAppId) || isRealValue(firebaseEnv.appId));

export const hasFirebaseWebAppIdOnly = (): boolean =>
  isRealValue(firebaseEnv.appId) && firebaseEnv.appId.includes(':web:') && !hasFirebaseEnvironment();

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

  return isDevRuntime() ? 'http://localhost:8000' : DEFAULT_PRODUCTION_BACKEND_BASE_URL;
};

export const hasGoogleClientIds = (platform: string = 'web'): boolean => {
  if (!isRealValue(googleEnv.webClientId)) {
    return false;
  }

  if (platform === 'ios') {
    return isRealValue(googleEnv.iosClientId);
  }

  if (platform === 'android') {
    return isRealValue(googleEnv.androidClientId) || isRealValue(googleEnv.webClientId);
  }

  return true;
};

export const getStoreReviewUrl = (platform: 'ios' | 'android' | 'web'): string | null => {
  if (platform === 'web') {
    return isRealValue(storeReviewEnv.androidUrl)
      ? storeReviewEnv.androidUrl
      : isRealValue(storeReviewEnv.iosUrl)
        ? storeReviewEnv.iosUrl
        : null;
  }

  const configuredUrl = platform === 'ios' ? storeReviewEnv.iosUrl : storeReviewEnv.androidUrl;
  return isRealValue(configuredUrl) ? configuredUrl : null;
};
