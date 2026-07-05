const DEFAULT_BODY_LIMIT_BYTES = 1024 * 1024;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 60;

const rateLimitBuckets =
  globalThis.__moneykaiRateLimitBuckets ||
  new Map();

globalThis.__moneykaiRateLimitBuckets = rateLimitBuckets;

const applySecurityHeaders = (res) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Content-Security-Policy', "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Origin-Agent-Cluster', '?1');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
};

const readRawBody = (req, options = {}) =>
  new Promise((resolve, reject) => {
    const limitBytes = options.limitBytes ?? DEFAULT_BODY_LIMIT_BYTES;

    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body, 'utf8') > limitBytes) {
        reject(Object.assign(new Error('Request body is too large.'), { statusCode: 413 }));
        return;
      }
      resolve(req.body);
      return;
    }

    if (Buffer.isBuffer(req.body)) {
      if (req.body.length > limitBytes) {
        reject(Object.assign(new Error('Request body is too large.'), { statusCode: 413 }));
        return;
      }
      resolve(req.body.toString('utf8'));
      return;
    }

    const chunks = [];
    let byteLength = 0;
    req.on('data', (chunk) => {
      const buffer = Buffer.from(chunk);
      byteLength += buffer.length;
      if (byteLength > limitBytes) {
        reject(Object.assign(new Error('Request body is too large.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(buffer);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

const readRawBodyBuffer = (req, options = {}) =>
  new Promise((resolve, reject) => {
    const limitBytes = options.limitBytes ?? DEFAULT_BODY_LIMIT_BYTES;

    if (Buffer.isBuffer(req.body)) {
      if (req.body.length > limitBytes) {
        reject(Object.assign(new Error('Request body is too large.'), { statusCode: 413 }));
        return;
      }
      resolve(req.body);
      return;
    }

    if (typeof req.body === 'string') {
      const buffer = Buffer.from(req.body, 'binary');
      if (buffer.length > limitBytes) {
        reject(Object.assign(new Error('Request body is too large.'), { statusCode: 413 }));
        return;
      }
      resolve(buffer);
      return;
    }

    const chunks = [];
    let byteLength = 0;
    req.on('data', (chunk) => {
      const buffer = Buffer.from(chunk);
      byteLength += buffer.length;
      if (byteLength > limitBytes) {
        reject(Object.assign(new Error('Request body is too large.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(buffer);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const readJsonBody = async (req, options) => {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  const rawBody = await readRawBody(req, options);
  if (!rawBody.trim()) {
    return {};
  }

  return JSON.parse(rawBody);
};

const sendJson = (res, status, payload) => {
  applySecurityHeaders(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(JSON.stringify(payload));
};

const getClientAddress = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const firstForwardedAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0];

  return (
    firstForwardedAddress?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

const applyRateLimit = (req, res, options = {}) => {
  const windowMs = options.windowMs ?? DEFAULT_RATE_LIMIT_WINDOW_MS;
  const max = options.max ?? DEFAULT_RATE_LIMIT_MAX;
  const keyPrefix = options.keyPrefix ?? req.url ?? 'default';
  const clientKey = `${keyPrefix}:${getClientAddress(req)}`;
  return applyRateLimitForKey(res, clientKey, { ...options, windowMs, max });
};

const applyRateLimitForKey = (res, clientKey, options = {}) => {
  const windowMs = options.windowMs ?? DEFAULT_RATE_LIMIT_WINDOW_MS;
  const max = options.max ?? DEFAULT_RATE_LIMIT_MAX;
  const now = Date.now();
  const existing = rateLimitBuckets.get(clientKey);

  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(clientKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  existing.count += 1;

  if (existing.count <= max) {
    return true;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  res.setHeader('Retry-After', String(retryAfterSeconds));
  sendJson(res, 429, {
    error: options.message || 'Too many requests. Please wait a moment and try again.',
  });

  if (rateLimitBuckets.size > 1000) {
    for (const [key, bucket] of rateLimitBuckets.entries()) {
      if (bucket.resetAt <= now) {
        rateLimitBuckets.delete(key);
      }
    }
  }

  return false;
};

const requireMethod = (req, res, method) => {
  if (req.method === method) {
    return true;
  }

  res.setHeader('Allow', method);
  sendJson(res, 405, { error: `Use ${method} for this endpoint.` });
  return false;
};

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : '';
};

const normalizeTrustedAppUrl = (value) => {
  if (!value) {
    return '';
  }

  const parsed = new URL(value);
  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error('Application URL must use HTTP or HTTPS.');
  }

  if (parsed.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) {
    throw new Error('Application URL must use HTTPS outside local development.');
  }

  parsed.username = '';
  parsed.password = '';
  parsed.hash = '';
  parsed.pathname = parsed.pathname.replace(/\/$/, '');
  return parsed.toString().replace(/\/$/, '');
};

const getAppUrl = () => {
  const configuredUrl = process.env.MONEYKAI_SITE_URL || process.env.PUBLIC_SITE_URL;
  if (configuredUrl) {
    return normalizeTrustedAppUrl(configuredUrl);
  }

  if (process.env.VERCEL_URL) {
    return normalizeTrustedAppUrl(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:8081';
  }

  throw new Error('MONEYKAI_SITE_URL is required for production billing redirects.');
};

module.exports = {
  applyRateLimitForKey,
  applyRateLimit,
  applySecurityHeaders,
  getAppUrl,
  getBearerToken,
  readJsonBody,
  readRawBody,
  readRawBodyBuffer,
  requireMethod,
  sendJson,
};
