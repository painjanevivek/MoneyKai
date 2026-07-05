const {
  applyRateLimit,
  requireMethod,
  sendJson,
} = require('../../../_lib/http');
const {
  completeGoogleOAuthCallback,
  getPublicGoogleOAuthError,
  getWebCallbackUrl,
} = require('../../../_lib/google-oauth');

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

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  if (!applyRateLimit(req, res, {
    keyPrefix: 'auth:google-callback:ip',
    max: 30,
    windowMs: 15 * 60 * 1000,
  })) {
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
