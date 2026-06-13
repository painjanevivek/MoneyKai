import { redactSensitiveSmsText } from '@/services/smsPrivacy';

export type DiagnosticSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface DiagnosticEvent {
  id: string;
  createdAt: string;
  scope: string;
  message: string;
  severity: DiagnosticSeverity;
  platform: string;
  appVersion?: string;
  errorName?: string;
  errorMessage?: string;
  errorStack?: string;
  metadata?: Record<string, unknown>;
}

export type DiagnosticEventSink = (event: DiagnosticEvent) => void | Promise<void>;

const MAX_RECENT_EVENTS = 50;
const MAX_STRING_LENGTH = 500;
const MAX_STACK_LENGTH = 2000;

const sensitiveMetadataKeys = new Set([
  'body',
  'content',
  'notificationbody',
  'notificationtitle',
  'rawbody',
  'rawbodystored',
  'rawpayload',
  'sender',
  'smsbody',
  'smstext',
  'text',
  'title',
]);

let eventSink: DiagnosticEventSink | undefined;
const recentEvents: DiagnosticEvent[] = [];
let diagnosticContext: Pick<DiagnosticEvent, 'platform' | 'appVersion'> = {
  platform: 'unknown',
};

const getRuntimePlatform = () => {
  if (diagnosticContext.platform !== 'unknown') {
    return diagnosticContext.platform;
  }

  const navigatorProduct = globalThis.navigator?.product;
  if (typeof navigatorProduct === 'string' && navigatorProduct.length > 0) {
    return navigatorProduct;
  }

  return 'unknown';
};

export const configureDiagnosticsContext = (context: Partial<Pick<DiagnosticEvent, 'platform' | 'appVersion'>>) => {
  diagnosticContext = {
    ...diagnosticContext,
    ...context,
  };
};

const isDevRuntime = () => typeof __DEV__ !== 'undefined' && __DEV__;

const createEventId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const toError = (error: unknown): Error | undefined => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return new Error(error.trim());
  }

  return undefined;
};

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

const sanitizeMetadataValue = (value: unknown, depth = 0): unknown => {
  if (depth > 3) {
    return '[Max depth]';
  }

  if (value == null || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return truncate(redactSensitiveSmsText(value), MAX_STRING_LENGTH);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeMetadataValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    return sanitizeMetadata(value as Record<string, unknown>, depth + 1);
  }

  return String(value);
};

export const sanitizeMetadata = (
  metadata?: Record<string, unknown>,
  depth = 0
): Record<string, unknown> | undefined => {
  if (!metadata) {
    return undefined;
  }

  const sanitized: Record<string, unknown> = {};
  Object.entries(metadata).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    sanitized[key] = sensitiveMetadataKeys.has(normalizedKey)
      ? '[Redacted]'
      : sanitizeMetadataValue(value, depth);
  });

  return sanitized;
};

export const setDiagnosticEventSink = (sink?: DiagnosticEventSink) => {
  eventSink = sink;
};

export const getRecentDiagnosticEvents = () => [...recentEvents];

export const clearRecentDiagnosticEvents = () => {
  recentEvents.splice(0, recentEvents.length);
};

export const captureDiagnosticEvent = (params: {
  scope: string;
  message: string;
  severity?: DiagnosticSeverity;
  error?: unknown;
  metadata?: Record<string, unknown>;
}): DiagnosticEvent => {
  const error = toError(params.error);
  const event: DiagnosticEvent = {
    id: createEventId(),
    createdAt: new Date().toISOString(),
    scope: params.scope,
    message: truncate(params.message, MAX_STRING_LENGTH),
    severity: params.severity ?? 'error',
    platform: getRuntimePlatform(),
    appVersion: diagnosticContext.appVersion,
    errorName: error?.name,
    errorMessage: error?.message ? truncate(error.message, MAX_STRING_LENGTH) : undefined,
    errorStack: error?.stack ? truncate(error.stack, MAX_STACK_LENGTH) : undefined,
    metadata: sanitizeMetadata(params.metadata),
  };

  recentEvents.push(event);
  if (recentEvents.length > MAX_RECENT_EVENTS) {
    recentEvents.splice(0, recentEvents.length - MAX_RECENT_EVENTS);
  }

  if (isDevRuntime()) {
    const logger = event.severity === 'info' ? console.info : event.severity === 'warning' ? console.warn : console.error;
    logger('[MoneyKai diagnostics]', event.scope, event.message, event.metadata ?? {});
  }

  if (eventSink) {
    Promise.resolve(eventSink(event)).catch((sinkError) => {
      if (isDevRuntime()) {
        console.warn('[MoneyKai diagnostics] Event sink failed:', sinkError);
      }
    });
  }

  return event;
};

export const captureException = (
  error: unknown,
  params: {
    scope: string;
    message?: string;
    severity?: DiagnosticSeverity;
    metadata?: Record<string, unknown>;
  }
) =>
  captureDiagnosticEvent({
    scope: params.scope,
    message: params.message ?? 'Unhandled exception',
    severity: params.severity ?? 'error',
    error,
    metadata: params.metadata,
  });
