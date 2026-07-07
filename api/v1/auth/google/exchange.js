const {
  applyRateLimit,
  applyRateLimitForKey,
  readJsonBody,
  requireMethod,
  sendJson,
} = require('../../../_lib/http');
const {
  consumeExchangeCode,
  getPublicGoogleOAuthError,
} = require('../../../_lib/google-oauth');
const {
  hashIdentifier,
  mintFirebaseCustomToken,
} = require('../../../_lib/firebase-identity');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  if (!(await applyRateLimit(req, res, {
    keyPrefix: 'auth:google-exchange:ip',
    max: 30,
    windowMs: 15 * 60 * 1000,
  }))) {
    return;
  }

  try {
    const payload = await readJsonBody(req, { limitBytes: 8 * 1024 });
    const code = String(payload.code || '');

    if (!(await applyRateLimitForKey(res, `auth:google-exchange:code:${hashIdentifier(code)}`, {
      max: 3,
      windowMs: 5 * 60 * 1000,
    }))) {
      return;
    }

    const exchange = consumeExchangeCode(code);
    if (!exchange.uid || typeof exchange.uid !== 'string') {
      sendJson(res, 400, { error: 'Google sign-in code is invalid.' });
      return;
    }

    const customToken = mintFirebaseCustomToken(exchange.uid, { provider: 'google.com' });

    sendJson(res, 200, {
      customToken,
      user: {
        uid: exchange.uid,
      },
      returnTo: exchange.returnTo || '/dashboard',
    });
  } catch (error) {
    const safe = getPublicGoogleOAuthError(error);
    sendJson(res, safe.status, { error: safe.message });
  }
};
