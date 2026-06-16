const crypto = require('node:crypto');

const isSentryHost = (hostname) =>
  hostname === 'sentry.io' || hostname.endsWith('.sentry.io');

const parseDsn = (dsn) => {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+/, '').split('/').pop();
    if (!projectId || !isSentryHost(url.hostname)) {
      return null;
    }
    return {
      dsn,
      envelopeUrl: `${url.protocol}//${url.hostname}${url.pathname.replace(/\/[^/]*$/, '')}/api/${projectId}/envelope/`,
      publicKey: url.username,
    };
  } catch {
    return null;
  }
};

const stacktraceFromError = (error) => {
  const stack = typeof error?.stack === 'string' ? error.stack.split('\n').slice(1) : [];
  return {
    frames: stack.reverse().map((line) => ({
      function: line.trim(),
      in_app: true,
    })),
  };
};

const captureServerException = async (error, context = {}) => {
  const dsn = process.env.SENTRY_DSN || process.env.EXPO_PUBLIC_SENTRY_DSN;
  const parsed = parseDsn(dsn);
  if (!parsed) {
    return;
  }

  const now = new Date().toISOString();
  const event = {
    event_id: crypto.randomBytes(16).toString('hex'),
    timestamp: now,
    platform: 'javascript',
    level: context.level || 'error',
    environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
    release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || undefined,
    server_name: process.env.VERCEL_URL || undefined,
    tags: {
      app: 'moneykai-web',
      runtime: 'vercel-api',
      ...context.tags,
    },
    extra: context.extra,
    exception: {
      values: [
        {
          type: error?.name || 'Error',
          value: error?.message || String(error),
          stacktrace: stacktraceFromError(error),
        },
      ],
    },
  };

  const envelope = [
    JSON.stringify({ dsn: parsed.dsn, sent_at: now }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n');

  await fetch(parsed.envelopeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    body: envelope,
  }).catch(() => {
    // Monitoring must never break production request handling.
  });
};

module.exports = { captureServerException };
