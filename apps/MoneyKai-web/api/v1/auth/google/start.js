const {
  applyRateLimit,
  readJsonBody,
  requireMethod,
  sendJson,
} = require('../../../_lib/http');
const {
  buildGoogleAuthorizationUrl,
  getPublicGoogleOAuthError,
} = require('../../../_lib/google-oauth');

const getHeaderValue = (value) => {
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
};

const getRequestOrigin = (req) => {
  const origin = getHeaderValue(req.headers.origin);
  if (origin) {
    return origin;
  }

  return getRequestHostOrigin(req);
};

const getRequestHostOrigin = (req) => {
  const host = getHeaderValue(req.headers['x-forwarded-host']) || getHeaderValue(req.headers.host);
  if (!host) {
    return '';
  }

  const proto = (getHeaderValue(req.headers['x-forwarded-proto']) || 'https').split(',')[0].trim();
  return `${proto}://${host.split(',')[0].trim()}`;
};

const logGoogleOAuthError = (error) => {
  console.error('google_oauth_start_failed', {
    name: error?.name,
    code: error?.code,
    status: error?.status,
    message: error?.message,
  });
};

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  if (!(await applyRateLimit(req, res, {
    keyPrefix: 'auth:google-start:ip',
    max: 20,
    windowMs: 15 * 60 * 1000,
  }))) {
    return;
  }

  try {
    const payload = await readJsonBody(req, { limitBytes: 4 * 1024 });
    const result = buildGoogleAuthorizationUrl({
      platform: payload.platform,
      returnTo: payload.returnTo,
      requestOrigin: getRequestOrigin(req),
      requestHostOrigin: getRequestHostOrigin(req),
    });

    sendJson(res, 200, result);
  } catch (error) {
    logGoogleOAuthError(error);
    const safe = getPublicGoogleOAuthError(error);
    sendJson(res, safe.status, { error: safe.message });
  }
};
