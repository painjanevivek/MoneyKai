const { applyRateLimit, readJsonBody, requireMethod, sendJson } = require('../_lib/http');

const MAX_EVENTS_PER_REQUEST = 20;
const MAX_PROPERTY_COUNT = 12;
const MAX_STRING_LENGTH = 180;
const ALLOWED_EVENT_TYPES = new Set(['page_view', 'user_event']);
const SENSITIVE_KEY_PATTERN =
  /(email|password|passcode|token|secret|authorization|otp|pin|card|cvv|pan|aadhaar|phone|mobile|name|raw|body|message|query|search)/i;

const clampString = (value, maxLength = MAX_STRING_LENGTH) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, maxLength);

const sanitizePath = (value) => {
  const path = clampString(value || '/', 240).split('?')[0].split('#')[0] || '/';
  return path
    .replace(/\/[0-9a-f]{8,}(?=\/|$)/gi, '/<id>')
    .replace(/\/\d{3,}(?=\/|$)/g, '/<id>');
};

const sanitizeEventName = (value) => {
  const normalized = clampString(value, 80).toLowerCase().replace(/[^a-z0-9_.:-]/g, '_');
  return normalized || 'unknown_event';
};

const sanitizeProperties = (properties) => {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return {};
  }

  const entries = Object.entries(properties).slice(0, MAX_PROPERTY_COUNT);
  return entries.reduce((safe, [key, value]) => {
    const safeKey = sanitizeEventName(key);
    if (SENSITIVE_KEY_PATTERN.test(safeKey)) {
      safe[safeKey] = '[redacted]';
      return safe;
    }

    if (typeof value === 'boolean' || typeof value === 'number') {
      safe[safeKey] = value;
      return safe;
    }

    if (typeof value === 'string') {
      safe[safeKey] = clampString(value);
    }

    return safe;
  }, {});
};

const sanitizeEvent = (event) => {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const type = ALLOWED_EVENT_TYPES.has(event.type) ? event.type : null;
  if (!type) {
    return null;
  }

  const occurredAt = new Date(event.occurredAt);
  return {
    type,
    name: sanitizeEventName(event.name),
    path: sanitizePath(event.path),
    occurredAt: Number.isNaN(occurredAt.getTime()) ? new Date().toISOString() : occurredAt.toISOString(),
    properties: sanitizeProperties(event.properties),
  };
};

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  if (!applyRateLimit(req, res, {
    keyPrefix: 'analytics:events',
    max: 120,
    windowMs: 60 * 1000,
  })) {
    return;
  }

  try {
    const payload = await readJsonBody(req, { limitBytes: 16 * 1024 });
    const incomingEvents = Array.isArray(payload.events) ? payload.events : [];
    const events = incomingEvents.slice(0, MAX_EVENTS_PER_REQUEST).map(sanitizeEvent).filter(Boolean);

    if (events.length === 0) {
      sendJson(res, 400, { error: 'No valid analytics events were provided.' });
      return;
    }

    console.info('[MoneyKaiAnalytics]', JSON.stringify({
      accepted: events.length,
      events,
    }));

    sendJson(res, 202, { ok: true, accepted: events.length });
  } catch {
    sendJson(res, 400, { error: 'Invalid analytics payload.' });
  }
};
