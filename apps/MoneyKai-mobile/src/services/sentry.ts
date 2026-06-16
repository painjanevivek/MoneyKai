import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { appEnvironment, getBackendBaseUrl } from '@/config/environment';
import type { User } from '@/stores/useAuthStore';

type SentryBreadcrumb = Parameters<typeof Sentry.addBreadcrumb>[0];

const packageInfo = require('../../package.json') as { name?: string; version?: string };

let initialized = false;

const SENSITIVE_KEY_PATTERN = /(password|passcode|token|secret|authorization|otp|pin|card|cvv|pan|aadhaar|sms|notification|raw|body|message)/i;
const SENSITIVE_VALUE_PATTERN = /(otp|one[-\s]?time|password|passcode|cvv|card|aadhaar|upi pin|authorization|bearer)/i;

const parseSampleRate = (value: string, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, parsed));
};

const redactObject = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') {
    return typeof value === 'string' && SENSITIVE_VALUE_PATTERN.test(value) ? '[Filtered]' : value;
  }

  if (Array.isArray(value)) {
    return value.map(redactObject);
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? '[Filtered]' : redactObject(entry),
    ]),
  );
};

const shouldDropBreadcrumb = (breadcrumb: SentryBreadcrumb): boolean => {
  const message = breadcrumb.message ?? '';
  const category = breadcrumb.category ?? '';
  return SENSITIVE_VALUE_PATTERN.test(message) || SENSITIVE_KEY_PATTERN.test(category);
};

const buildRelease = (): string => {
  if (appEnvironment.sentry.release) {
    return appEnvironment.sentry.release;
  }

  return `${packageInfo.name ?? 'moneykai-mobile'}@${packageInfo.version ?? '0.0.0'}`;
};

const buildTracePropagationTargets = (): Array<string | RegExp> => {
  const backendBaseUrl = getBackendBaseUrl();
  const targets: Array<string | RegExp> = ['localhost', /^http:\/\/10\.0\.2\.2(?::\d+)?\//];

  if (backendBaseUrl) {
    targets.push(backendBaseUrl);
  }

  return targets;
};

export const initMoneyKaiSentry = () => {
  if (initialized) {
    return;
  }

  initialized = true;

  const dsn = appEnvironment.sentry.dsn;
  const environment = appEnvironment.sentry.environment || (__DEV__ ? 'development' : 'production');
  const isProduction = environment === 'production' && !__DEV__;
  const enabled = Boolean(dsn) && appEnvironment.sentry.enabled !== 'false';

  Sentry.init({
    dsn,
    enabled,
    debug: !isProduction && appEnvironment.debug,
    environment,
    release: buildRelease(),
    dist: appEnvironment.sentry.dist || undefined,
    sampleRate: parseSampleRate(appEnvironment.sentry.errorSampleRate, 1),
    tracesSampleRate: parseSampleRate(appEnvironment.sentry.tracesSampleRate, isProduction ? 0.15 : 1),
    profilesSampleRate: parseSampleRate(appEnvironment.sentry.profilesSampleRate, isProduction ? 0.1 : 1),
    tracePropagationTargets: buildTracePropagationTargets(),
    enableAutoPerformanceTracing: true,
    enableUserInteractionTracing: true,
    enableNativeCrashHandling: true,
    enableNativeFramesTracking: true,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30_000,
    maxBreadcrumbs: 80,
    maxValueLength: 500,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    replaysOnErrorSampleRate: parseSampleRate(appEnvironment.sentry.replayErrorSampleRate, 1),
    replaysSessionSampleRate: parseSampleRate(
      appEnvironment.sentry.replaySessionSampleRate,
      isProduction ? 0.03 : 1,
    ),
    replaysSessionQuality: isProduction ? 'low' : 'medium',
    enableLogs: true,
    integrations: [
      Sentry.reactNativeTracingIntegration({
        shouldCreateSpanForRequest: (url) => !/\/(health|metrics|heartbeat)(\/|\?|$)/i.test(url),
      }),
      Sentry.hermesProfilingIntegration({
        platformProfilers: true,
      }),
      Sentry.mobileReplayIntegration({
        maskAllText: true,
        maskAllImages: true,
        maskAllVectors: true,
        excludedViewClasses: ['WKWebView', 'UIWebView'],
      }),
      Sentry.consoleLoggingIntegration({
        levels: isProduction ? ['warn', 'error'] : ['log', 'warn', 'error'],
      }),
    ],
    beforeBreadcrumb: (breadcrumb) => {
      if (shouldDropBreadcrumb(breadcrumb)) {
        return null;
      }

      if (breadcrumb.data) {
        breadcrumb.data = redactObject(breadcrumb.data) as Record<string, unknown>;
      }

      return breadcrumb;
    },
    beforeSend: (event) => {
      event.extra = redactObject(event.extra) as typeof event.extra;
      event.contexts = redactObject(event.contexts) as typeof event.contexts;
      return event;
    },
    beforeSendTransaction: (event) => {
      if (event.transaction?.includes('health') || event.transaction?.includes('heartbeat')) {
        return null;
      }

      return event;
    },
    beforeSendLog: (log) => {
      if (isProduction && (log.level === 'trace' || log.level === 'debug')) {
        return null;
      }

      if (log.attributes) {
        log.attributes = redactObject(log.attributes) as typeof log.attributes;
      }

      return SENSITIVE_VALUE_PATTERN.test(log.message ?? '') ? null : log;
    },
  });

  Sentry.setTags({
    app_surface: 'mobile',
    runtime: 'react-native',
    platform: Platform.OS,
  });
  Sentry.setContext('moneykai.features', {
    gmailSyncEnabled: appEnvironment.gmailSyncEnabled,
    pdfStatementParsingEnabled: appEnvironment.pdfStatementParsingEnabled,
    wealthTabEnabled: appEnvironment.wealthTabEnabled,
    financialAiEnabled: appEnvironment.financialAiEnabled,
    smsResearchBuild: appEnvironment.smsResearchBuild,
    nativeSmsResearchBuild: appEnvironment.nativeSmsResearchBuild,
  });
};

export const syncSentryUser = (user: User | null) => {
  if (!user) {
    Sentry.setUser(null);
    Sentry.setTag('auth.provider', 'anonymous');
    return;
  }

  Sentry.setUser({
    id: user.id,
    username: user.auth_provider ?? 'email',
  });
  Sentry.setTag('auth.provider', user.auth_provider ?? 'email');
};

export const addSentryBreadcrumb = (breadcrumb: SentryBreadcrumb) => {
  if (!shouldDropBreadcrumb(breadcrumb)) {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

export const captureSentryException = (
  error: unknown,
  context: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  } = {},
) => {
  Sentry.withScope((scope) => {
    Object.entries(context.tags ?? {}).forEach(([key, value]) => scope.setTag(key, value));
    if (context.level) {
      scope.setLevel(context.level);
    }
    if (context.extra) {
      scope.setContext('moneykai.extra', redactObject(context.extra) as Record<string, unknown>);
    }
    Sentry.captureException(error);
  });
};

export const startSentrySpan = <T>(
  options: Parameters<typeof Sentry.startSpan>[0],
  callback: () => T,
): T => Sentry.startSpan(options, callback);
