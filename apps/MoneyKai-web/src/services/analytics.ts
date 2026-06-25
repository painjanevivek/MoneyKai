import { Platform } from 'react-native';
import { hasAnalyticsConsent } from '@/services/cookieConsent';
import { addSentryBreadcrumb } from '@/services/sentry';

type AnalyticsEventType = 'page_view' | 'user_event';

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

type AnalyticsEvent = {
  type: AnalyticsEventType;
  name: string;
  path: string;
  occurredAt: string;
  properties: Record<string, string | number | boolean>;
};

const ANALYTICS_ENDPOINT = '/api/analytics/events';
const FLUSH_DELAY_MS = 750;
const MAX_QUEUE_SIZE = 20;
const MAX_PROPERTY_COUNT = 12;
const MAX_STRING_LENGTH = 180;
const SENSITIVE_KEY_PATTERN =
  /(email|password|passcode|token|secret|authorization|otp|pin|card|cvv|pan|aadhaar|phone|mobile|name|raw|body|message|query|search)/i;

let queue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let lifecycleFlushInstalled = false;
let lastPageView: { path: string; trackedAt: number } | null = null;

const canTrackAnalytics = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && hasAnalyticsConsent();

const clampString = (value: unknown, maxLength = MAX_STRING_LENGTH) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, maxLength);

const sanitizeEventName = (value: string) => {
  const normalized = clampString(value, 80).toLowerCase().replace(/[^a-z0-9_.:-]/g, '_');
  return normalized || 'unknown_event';
};

export const sanitizeAnalyticsPath = (value: string) => {
  const path = clampString(value || '/', 240).split('?')[0].split('#')[0] || '/';
  return path
    .replace(/\/[0-9a-f]{8,}(?=\/|$)/gi, '/<id>')
    .replace(/\/\d{3,}(?=\/|$)/g, '/<id>');
};

const getCurrentPath = () =>
  typeof window === 'undefined' ? '/' : sanitizeAnalyticsPath(window.location.pathname || '/');

const sanitizeProperties = (properties: AnalyticsProperties = {}) => {
  const entries = Object.entries(properties).slice(0, MAX_PROPERTY_COUNT);
  return entries.reduce<Record<string, string | number | boolean>>((safe, [key, value]) => {
    if (value === null || typeof value === 'undefined') {
      return safe;
    }

    const safeKey = sanitizeEventName(key);
    if (SENSITIVE_KEY_PATTERN.test(safeKey)) {
      safe[safeKey] = '[redacted]';
      return safe;
    }

    if (typeof value === 'boolean' || typeof value === 'number') {
      safe[safeKey] = value;
      return safe;
    }

    safe[safeKey] = clampString(value);
    return safe;
  }, {});
};

const installLifecycleFlush = () => {
  if (lifecycleFlushInstalled || typeof window === 'undefined') {
    return;
  }

  lifecycleFlushInstalled = true;
  window.addEventListener('pagehide', flushAnalyticsQueue);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushAnalyticsQueue();
    }
  });
};

const scheduleFlush = () => {
  if (flushTimer || typeof window === 'undefined') {
    return;
  }

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flushAnalyticsQueue();
  }, FLUSH_DELAY_MS);
};

const sendEvents = (events: AnalyticsEvent[]) => {
  const body = JSON.stringify({ events });

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(ANALYTICS_ENDPOINT, blob)) {
      return;
    }
  }

  void fetch(ANALYTICS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined);
};

export const flushAnalyticsQueue = () => {
  if (!canTrackAnalytics() || queue.length === 0) {
    queue = [];
    return;
  }

  const events = queue.splice(0, MAX_QUEUE_SIZE);
  sendEvents(events);
};

const enqueueAnalyticsEvent = (event: AnalyticsEvent) => {
  if (!canTrackAnalytics()) {
    return;
  }

  installLifecycleFlush();
  queue.push(event);
  if (queue.length >= MAX_QUEUE_SIZE) {
    flushAnalyticsQueue();
    return;
  }

  scheduleFlush();
  void addSentryBreadcrumb({
    category: `analytics.${event.type}`,
    message: event.name,
    level: 'info',
    data: {
      path: event.path,
      ...event.properties,
    },
  });
};

export const trackPageView = (pathname: string, properties?: AnalyticsProperties) => {
  if (!canTrackAnalytics()) {
    return;
  }

  const path = sanitizeAnalyticsPath(pathname);
  const now = Date.now();
  if (lastPageView?.path === path && now - lastPageView.trackedAt < 1500) {
    return;
  }

  lastPageView = { path, trackedAt: now };
  enqueueAnalyticsEvent({
    type: 'page_view',
    name: 'page_view',
    path,
    occurredAt: new Date(now).toISOString(),
    properties: sanitizeProperties(properties),
  });
};

export const trackUserEvent = (name: string, properties?: AnalyticsProperties) => {
  if (!canTrackAnalytics()) {
    return;
  }

  enqueueAnalyticsEvent({
    type: 'user_event',
    name: sanitizeEventName(name),
    path: getCurrentPath(),
    occurredAt: new Date().toISOString(),
    properties: sanitizeProperties(properties),
  });
};
