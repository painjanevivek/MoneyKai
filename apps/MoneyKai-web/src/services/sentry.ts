import { Platform } from 'react-native';
import { appEnvironment } from '@/config/environment';
import type { User } from '@/stores/useAuthStore';

let sentryModulePromise: Promise<typeof import('@sentry/react')> | null = null;
let sentryReady = false;

const sanitizeRate = (value: string, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, parsed));
};

const getSentry = () => {
  if (!sentryModulePromise) {
    sentryModulePromise = import('@sentry/react');
  }
  return sentryModulePromise;
};

const stripQuery = (value: string | undefined) => value?.split('?')[0].split('#')[0] ?? value;

export const initSentry = async () => {
  if (sentryReady || Platform.OS !== 'web' || !appEnvironment.sentryDsn) {
    return;
  }

  const Sentry = await getSentry();
  const release =
    appEnvironment.sentryRelease ||
    process.env.SENTRY_RELEASE ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    undefined;

  Sentry.init({
    dsn: appEnvironment.sentryDsn,
    enabled: process.env.NODE_ENV === 'production' || appEnvironment.sentryDebug,
    environment: appEnvironment.sentryEnvironment || process.env.NODE_ENV || 'development',
    release,
    sendDefaultPii: false,
    attachStacktrace: true,
    maxBreadcrumbs: 80,
    tunnel: '/api/monitoring',
    enableLogs: true,
    integrations: [
      Sentry.browserTracingIntegration({
        enableLongTask: true,
        enableLongAnimationFrame: true,
        enableInp: true,
        beforeStartSpan: (context) => ({
          ...context,
          name: context.name
            .replace(/\/[0-9a-f]{8,}(?=\/|$)/gi, '/<id>')
            .replace(/\/\d+(?=\/|$)/g, '/<id>'),
        }),
        shouldCreateSpanForRequest: (url) =>
          !url.includes('/api/monitoring') &&
          !url.includes('/health') &&
          !url.includes('/sitemap.xml') &&
          !url.includes('/robots.txt'),
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
        block: ['iframe[srcdoc]', '[data-financial-private]', '.financial-private'],
        ignore: ['input[type="password"]', '[data-sentry-ignore]'],
        slowClickIgnoreSelectors: ['a[download]', '[aria-label*="download" i]', '[aria-label*="copy" i]'],
        beforeErrorSampling: (event) => event.logger !== 'console',
      }),
      Sentry.consoleLoggingIntegration({
        levels: ['warn', 'error'],
      }),
    ],
    tracesSampler: ({ name, inheritOrSampleWith }) => {
      if (name.includes('/api/monitoring') || name.includes('/health')) {
        return 0;
      }
      if (name.includes('/pricing') || name.includes('/api/billing') || name.includes('/(auth)')) {
        return 1.0;
      }
      return inheritOrSampleWith(appEnvironment.sentryTraceSampleRate);
    },
    tracePropagationTargets: ['localhost', /^\/api\//],
    replaysSessionSampleRate: appEnvironment.sentryReplaySessionSampleRate,
    replaysOnErrorSampleRate: appEnvironment.sentryReplayErrorSampleRate,
    beforeSend(event) {
      event.tags = {
        ...event.tags,
        app: 'moneykai-web',
        surface: 'expo-web',
        deployment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'local',
      };

      if (event.request?.url) {
        event.request.url = stripQuery(event.request.url);
      }

      if (event.user?.email) {
        delete event.user.email;
      }

      return event;
    },
    beforeSendTransaction(event) {
      event.tags = {
        ...event.tags,
        app: 'moneykai-web',
        surface: 'expo-web',
      };
      return event;
    },
    beforeSendLog(log) {
      if (process.env.NODE_ENV === 'production' && (log.level === 'debug' || log.level === 'trace')) {
        return null;
      }
      return log;
    },
    debug: appEnvironment.sentryDebug,
  });

  Sentry.setTags({
    app: 'moneykai-web',
    surface: 'expo-web',
    platform: Platform.OS,
  });
  Sentry.setContext('release', {
    release,
    vercelEnv: process.env.VERCEL_ENV || null,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
  });

  sentryReady = true;
};

void initSentry();

export const identifySentryUser = async (user: User | null) => {
  if (!appEnvironment.sentryDsn || Platform.OS !== 'web') {
    return;
  }

  const Sentry = await getSentry();
  if (!user) {
    Sentry.setUser(null);
    Sentry.setTag('auth.state', 'signed_out');
    return;
  }

  Sentry.setUser({ id: user.id });
  Sentry.setTags({
    'auth.state': 'signed_in',
    'auth.provider': user.auth_provider ?? 'email',
  });
};

export const captureSentryException = async (
  error: unknown,
  context?: Parameters<typeof import('@sentry/react')['captureException']>[1],
) => {
  if (!appEnvironment.sentryDsn || Platform.OS !== 'web') {
    return undefined;
  }

  const Sentry = await getSentry();
  return Sentry.captureException(error, context);
};

export const addSentryBreadcrumb = async (
  breadcrumb: Parameters<typeof import('@sentry/react')['addBreadcrumb']>[0],
) => {
  if (!appEnvironment.sentryDsn || Platform.OS !== 'web') {
    return;
  }

  const Sentry = await getSentry();
  Sentry.addBreadcrumb(breadcrumb);
};

export const startSentrySpan = async <T>(
  options: Parameters<typeof import('@sentry/react')['startSpan']>[0],
  callback: () => T | Promise<T>,
): Promise<T> => {
  if (!appEnvironment.sentryDsn || Platform.OS !== 'web') {
    return callback();
  }

  const Sentry = await getSentry();
  return Sentry.startSpan(options, callback);
};
