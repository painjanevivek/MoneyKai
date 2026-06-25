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

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  if (!applyRateLimit(req, res, {
    keyPrefix: 'auth:google-start:ip',
    max: 20,
    windowMs: 15 * 60 * 1000,
  })) {
    return;
  }

  try {
    const payload = await readJsonBody(req, { limitBytes: 4 * 1024 });
    const result = buildGoogleAuthorizationUrl({
      platform: payload.platform,
      returnTo: payload.returnTo,
    });

    sendJson(res, 200, result);
  } catch (error) {
    const safe = getPublicGoogleOAuthError(error);
    sendJson(res, safe.status, { error: safe.message });
  }
};
