const {
  applyRateLimit,
  applyRateLimitForKey,
  readJsonBody,
  requireMethod,
  sendJson,
} = require('./http');
const {
  buildGoogleAuthorizationUrl,
  completeGoogleOAuthCallback,
  consumeExchangeCode,
  getGoogleOAuthSetupStatus,
  getPublicGoogleOAuthError,
  getWebCallbackUrl,
} = require('./google-oauth');
const {
  hashIdentifier,
  mintFirebaseCustomToken,
} = require('./firebase-identity');

const getHeaderValue = (value) => {
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
};

const getRequestHostOrigin = (req) => {
  const host = getHeaderValue(req.headers['x-forwarded-host']) || getHeaderValue(req.headers.host);
  if (!host) {
    return '';
  }

  const proto = (getHeaderValue(req.headers['x-forwarded-proto']) || 'https').split(',')[0].trim();
  return `${proto}://${host.split(',')[0].trim()}`;
};

const getRequestOrigin = (req) => getHeaderValue(req.headers.origin) || getRequestHostOrigin(req);

const logGoogleOAuthError = (event, error) => {
  console.error(event, {
    name: error?.name,
    code: error?.code,
    status: error?.status,
    message: error?.message,
  });
};

const redirectTo = (res, location) => {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
};

const getQuery = (req) => {
  if (req.query) {
    return req.query;
  }

  const url = new URL(req.url || '/', 'https://moneykai.local');
  return Object.fromEntries(url.searchParams.entries());
};

const redirectToAppError = (res, message) => {
  const location = getWebCallbackUrl('', '/dashboard');
  const url = new URL(location);
  url.searchParams.delete('code');
  url.searchParams.set('error', message);
  redirectTo(res, url.toString());
};

const start = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  if (!(await applyRateLimit(req, res, {
    keyPrefix: 'auth:google-start:ip',
    max: 20,
    windowMs: 15 * 60 * 1000,
    requireDistributed: process.env.NODE_ENV === 'production',
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
    logGoogleOAuthError('google_oauth_start_failed', error);
    const safe = getPublicGoogleOAuthError(error);
    sendJson(res, safe.status, { error: safe.message });
  }
};

const callback = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  if (!(await applyRateLimit(req, res, {
    keyPrefix: 'auth:google-callback:ip',
    max: 30,
    windowMs: 15 * 60 * 1000,
    requireDistributed: process.env.NODE_ENV === 'production',
  }))) {
    return;
  }

  const query = getQuery(req);
  if (query.error) {
    try {
      redirectToAppError(res, 'Google sign-in was cancelled or rejected.');
    } catch {
      sendJson(res, 400, { error: 'Google sign-in was cancelled or rejected.' });
    }
    return;
  }

  try {
    const location = await completeGoogleOAuthCallback({
      code: Array.isArray(query.code) ? query.code[0] : query.code,
      state: Array.isArray(query.state) ? query.state[0] : query.state,
    });
    redirectTo(res, location);
  } catch (error) {
    const safe = getPublicGoogleOAuthError(error);
    try {
      redirectToAppError(res, safe.message);
    } catch {
      sendJson(res, safe.status, { error: safe.message });
    }
  }
};

const exchange = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  if (!(await applyRateLimit(req, res, {
    keyPrefix: 'auth:google-exchange:ip',
    max: 30,
    windowMs: 15 * 60 * 1000,
    requireDistributed: process.env.NODE_ENV === 'production',
  }))) {
    return;
  }

  try {
    const payload = await readJsonBody(req, { limitBytes: 8 * 1024 });
    const code = String(payload.code || '');
    const transactionVerifier = String(payload.transactionVerifier || '');

    if (!(await applyRateLimitForKey(res, `auth:google-exchange:code:${hashIdentifier(code)}`, {
      max: 3,
      windowMs: 5 * 60 * 1000,
      requireDistributed: process.env.NODE_ENV === 'production',
    }))) {
      return;
    }

    const result = await consumeExchangeCode(code, transactionVerifier);
    if (!result.uid || typeof result.uid !== 'string') {
      sendJson(res, 400, { error: 'Google sign-in code is invalid.' });
      return;
    }

    const customToken = mintFirebaseCustomToken(result.uid, { provider: 'google.com' });
    sendJson(res, 200, {
      customToken,
      user: { uid: result.uid },
      returnTo: result.returnTo || '/dashboard',
    });
  } catch (error) {
    const safe = getPublicGoogleOAuthError(error);
    sendJson(res, safe.status, { error: safe.message });
  }
};

const setupStatus = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  if (!(await applyRateLimit(req, res, {
    keyPrefix: 'auth:google-setup-status:ip',
    max: 30,
    windowMs: 15 * 60 * 1000,
  }))) {
    return;
  }

  sendJson(res, 200, getGoogleOAuthSetupStatus({
    requestHostOrigin: getRequestHostOrigin(req),
  }));
};

const handlers = { start, callback, exchange, 'setup-status': setupStatus };

const getAction = (req) => {
  const query = getQuery(req);
  const action = Array.isArray(query.action) ? query.action[0] : query.action;
  return String(action || '');
};

const selectGoogleOAuthHandler = (action) => handlers[action] || null;

const googleOAuthRouter = async (req, res) => {
  const handler = selectGoogleOAuthHandler(getAction(req));
  if (!handler) {
    sendJson(res, 404, { error: 'Google auth route not found.' });
    return;
  }

  await handler(req, res);
};

module.exports = googleOAuthRouter;
module.exports.handlers = handlers;
module.exports.selectGoogleOAuthHandler = selectGoogleOAuthHandler;
