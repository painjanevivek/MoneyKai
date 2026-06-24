const PLACEHOLDER_PATTERNS = ['placeholder', 'REPLACE_ME', 'your-project', 'your-api-key'];

const readEnv = (key: string): string => process.env[key]?.trim() ?? '';

const isRealValue = (value: string): boolean =>
  value.length > 0 && !PLACEHOLDER_PATTERNS.some((pattern) => value.includes(pattern));

const sanitizeRate = (value: string, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, parsed));
};

const storeReviewEnv = {
  iosUrl: readEnv('EXPO_PUBLIC_APP_STORE_URL'),
  androidUrl: readEnv('EXPO_PUBLIC_PLAY_STORE_URL'),
};

const normalizeBackendBaseUrl = (value: string): string => {
  const trimmed = value.trim().replace(/\/$/, '');
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const backendBaseUrl = normalizeBackendBaseUrl(readEnv('EXPO_PUBLIC_BACKEND_BASE_URL'));
const isDevRuntime = (): boolean => typeof __DEV__ !== 'undefined' && __DEV__;
const gmailSyncEnabledValue = readEnv('EXPO_PUBLIC_GMAIL_SYNC_ENABLED');
const pdfStatementParsingEnabledValue = readEnv('EXPO_PUBLIC_PDF_STATEMENT_PARSING_ENABLED');
const wealthTabEnabledValue = readEnv('EXPO_PUBLIC_WEALTH_TAB_ENABLED');
const financialAiEnabledValue = readEnv('EXPO_PUBLIC_FINANCIAL_AI_ENABLED');
const linkedAccountDemoEnabledValue = readEnv('EXPO_PUBLIC_LINKED_ACCOUNT_DEMO_ENABLED');
const sentryTraceSampleRateValue = readEnv('EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE');
const sentryReplaySessionSampleRateValue = readEnv('EXPO_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE');
const sentryReplayErrorSampleRateValue = readEnv('EXPO_PUBLIC_SENTRY_REPLAY_ERROR_SAMPLE_RATE');
const sentryDsnValue = readEnv('EXPO_PUBLIC_SENTRY_DSN');
const DEFAULT_PRODUCTION_BACKEND_BASE_URL = 'https://money-kai-backend.vercel.app';

export const appEnvironment = {
  backendBaseUrl,
  gmailSyncEnabled: gmailSyncEnabledValue === 'true',
  pdfStatementParsingEnabled: pdfStatementParsingEnabledValue === 'true',
  wealthTabEnabled: wealthTabEnabledValue === '' ? true : wealthTabEnabledValue === 'true',
  financialAiEnabled: financialAiEnabledValue === 'true',
  linkedAccountDemoEnabled: linkedAccountDemoEnabledValue === 'true',
  sentryDsn: isRealValue(sentryDsnValue) ? sentryDsnValue : '',
  sentryEnvironment: readEnv('EXPO_PUBLIC_SENTRY_ENVIRONMENT'),
  sentryRelease: readEnv('EXPO_PUBLIC_SENTRY_RELEASE'),
  sentryTraceSampleRate: sanitizeRate(sentryTraceSampleRateValue, isDevRuntime() ? 1 : 0.1),
  sentryReplaySessionSampleRate: sanitizeRate(sentryReplaySessionSampleRateValue, isDevRuntime() ? 1 : 0.05),
  sentryReplayErrorSampleRate: sanitizeRate(sentryReplayErrorSampleRateValue, 1),
  sentryDebug: readEnv('EXPO_PUBLIC_SENTRY_DEBUG') === 'true',
};

export const isGmailSyncEnabled = (): boolean =>
  appEnvironment.gmailSyncEnabled;

export const isPdfStatementParsingEnabled = (): boolean =>
  appEnvironment.pdfStatementParsingEnabled;

export const isWealthTabEnabled = (): boolean =>
  appEnvironment.wealthTabEnabled;

export const isFinancialAiEnabled = (): boolean =>
  appEnvironment.financialAiEnabled;

export const isLinkedAccountDemoEnabled = (): boolean =>
  appEnvironment.linkedAccountDemoEnabled;

export const getBackendBaseUrl = (): string => {
  if (appEnvironment.backendBaseUrl.length > 0) {
    return appEnvironment.backendBaseUrl;
  }

  return isDevRuntime() ? 'http://localhost:8000' : DEFAULT_PRODUCTION_BACKEND_BASE_URL;
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
