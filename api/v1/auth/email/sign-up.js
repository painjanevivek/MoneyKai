const {
  applyRateLimit,
  applyRateLimitForKey,
  readJsonBody,
  requireMethod,
  sendJson,
} = require('../../../_lib/http');
const {
  createEmailPasswordUser,
  getPublicFirebaseAuthError,
  hashIdentifier,
  normalizeEmail,
} = require('../../../_lib/firebase-identity');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  if (!applyRateLimit(req, res, {
    keyPrefix: 'auth:email-sign-up:ip',
    max: 12,
    windowMs: 60 * 60 * 1000,
  })) {
    return;
  }

  try {
    const payload = await readJsonBody(req, { limitBytes: 4 * 1024 });
    const email = normalizeEmail(payload.email);

    if (!applyRateLimitForKey(res, `auth:email-sign-up:email:${hashIdentifier(email)}`, {
      max: 3,
      windowMs: 24 * 60 * 60 * 1000,
    })) {
      return;
    }

    const result = await createEmailPasswordUser({
      email,
      password: payload.password,
      displayName: payload.displayName,
    });

    sendJson(res, 201, {
      customToken: result.customToken,
      user: {
        uid: result.uid,
        email: result.email,
        displayName: result.displayName,
      },
    });
  } catch (error) {
    const safe = getPublicFirebaseAuthError(error, 'Sign up failed.');
    sendJson(res, safe.status, { error: safe.message });
  }
};
