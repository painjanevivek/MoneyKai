const {
  applyRateLimit,
  applySecurityHeaders,
  readRawBodyBuffer,
  requireMethod,
  sendJson,
} = require('./_lib/http');

const MAX_ENVELOPE_BYTES = 256 * 1024;
const MAX_ENVELOPE_ITEMS = 20;
const MAX_HEADER_BYTES = 8 * 1024;
const MAX_ITEM_HEADER_BYTES = 4 * 1024;
const ALLOWED_ITEM_TYPES = new Set([
  'attachment',
  'check_in',
  'client_report',
  'event',
  'feedback',
  'log',
  'metric_buckets',
  'profile',
  'profile_chunk',
  'replay_event',
  'replay_recording',
  'session',
  'sessions',
  'statsd',
  'transaction',
  'user_report',
]);

const isSentryHost = (hostname) =>
  hostname === 'sentry.io' || hostname.endsWith('.sentry.io');

const parseDsn = (dsn) => {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+/, '').split('/').pop();
    if (
      url.protocol !== 'https:' ||
      !url.username ||
      !projectId ||
      !/^\d+$/.test(projectId) ||
      !isSentryHost(url.hostname)
    ) {
      return null;
    }
    return {
      envelopeUrl: `${url.protocol}//${url.hostname}${url.pathname.replace(/\/[^/]*$/, '')}/api/${projectId}/envelope/`,
      host: url.hostname,
      projectId,
      publicKey: url.username,
    };
  } catch {
    return null;
  }
};

const createEnvelopeError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

const readEnvelopeLine = (body, offset, maxBytes, label) => {
  const newlineIndex = body.indexOf(0x0a, offset);
  const end = newlineIndex === -1 ? body.length : newlineIndex;
  if (end - offset > maxBytes) {
    throw createEnvelopeError(`${label} is too large.`);
  }
  const line = body.subarray(offset, end).toString('utf8').replace(/\r$/, '');
  return {
    line,
    nextOffset: newlineIndex === -1 ? body.length : newlineIndex + 1,
  };
};

const parseEnvelopeJsonLine = (line, label) => {
  try {
    const value = JSON.parse(line);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Invalid object.');
    }
    return value;
  } catch {
    throw createEnvelopeError(`${label} is invalid.`);
  }
};

const validateSentryEnvelope = (body) => {
  if (!Buffer.isBuffer(body) || body.length === 0) {
    throw createEnvelopeError('Sentry envelope is empty.');
  }

  const envelopeLine = readEnvelopeLine(body, 0, MAX_HEADER_BYTES, 'Sentry envelope header');
  const header = parseEnvelopeJsonLine(envelopeLine.line, 'Sentry envelope header');
  let offset = envelopeLine.nextOffset;
  let itemCount = 0;

  while (offset < body.length) {
    if (body[offset] === 0x0a) {
      offset += 1;
      continue;
    }

    const itemLine = readEnvelopeLine(body, offset, MAX_ITEM_HEADER_BYTES, 'Sentry item header');
    const itemHeader = parseEnvelopeJsonLine(itemLine.line, 'Sentry item header');
    const itemType = itemHeader.type;
    if (typeof itemType !== 'string' || !ALLOWED_ITEM_TYPES.has(itemType)) {
      throw createEnvelopeError('Sentry envelope item type is not allowed.');
    }

    itemCount += 1;
    if (itemCount > MAX_ENVELOPE_ITEMS) {
      throw createEnvelopeError(`Sentry envelope may contain at most ${MAX_ENVELOPE_ITEMS} items.`);
    }

    offset = itemLine.nextOffset;
    if (Number.isInteger(itemHeader.length)) {
      if (itemHeader.length <= 0 || offset + itemHeader.length > body.length) {
        throw createEnvelopeError('Sentry envelope item length is invalid.');
      }
      offset += itemHeader.length;
      if (offset < body.length && body[offset] === 0x0a) {
        offset += 1;
      }
    } else {
      const payloadLine = readEnvelopeLine(body, offset, MAX_ENVELOPE_BYTES, 'Sentry item payload');
      if (!payloadLine.line) {
        throw createEnvelopeError('Sentry envelope item payload is empty.');
      }
      offset = payloadLine.nextOffset;
    }
  }

  if (itemCount === 0) {
    throw createEnvelopeError('Sentry envelope must contain at least one item.');
  }

  return header;
};

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }
  if (!(await applyRateLimit(req, res, {
    keyPrefix: 'monitoring:sentry-tunnel',
    max: 120,
    windowMs: 60 * 1000,
    requireDistributed: process.env.NODE_ENV === 'production',
  }))) {
    return;
  }

  try {
    const rawBody = await readRawBodyBuffer(req, { limitBytes: MAX_ENVELOPE_BYTES });
    const envelopeHeader = validateSentryEnvelope(rawBody);
    const configured = parseDsn(process.env.SENTRY_DSN || process.env.EXPO_PUBLIC_SENTRY_DSN);
    const envelopeDsn = envelopeHeader.dsn ? parseDsn(envelopeHeader.dsn) : null;

    if (!configured) {
      return sendJson(res, 400, { error: 'Invalid Sentry DSN for monitoring tunnel.' });
    }

    if (
      !envelopeDsn ||
      envelopeDsn.publicKey !== configured.publicKey ||
      envelopeDsn.host !== configured.host ||
      envelopeDsn.projectId !== configured.projectId
    ) {
      return sendJson(res, 403, { error: 'Sentry envelope DSN is not allowed.' });
    }

    const response = await fetch(configured.envelopeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      body: rawBody,
    });

    if (!response.ok) {
      return sendJson(res, response.status, { error: `Sentry ingest returned ${response.status}.` });
    }

    applySecurityHeaders(res);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send('');
  } catch (error) {
    return sendJson(res, error.statusCode || 400, { error: error.message || 'Unable to relay Sentry envelope.' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports.validateSentryEnvelope = validateSentryEnvelope;
