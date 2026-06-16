const DEFAULT_BODY_LIMIT_BYTES = 1024 * 1024;

const applySecurityHeaders = (res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
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
  applySecurityHeaders,
  getAppUrl,
  getBearerToken,
  readJsonBody,
  readRawBody,
  requireMethod,
  sendJson,
};
