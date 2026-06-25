const {
  applyRateLimit,
  applyRateLimitForKey,
  readJsonBody,
  requireMethod,
  sendJson,
} = require('../../../_lib/http');
const {
  getPublicFirebaseAuthError,
  hashIdentifier,
  normalizeEmail,
  signInWithEmailPassword,
} = require('../../../_lib/firebase-identity');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  if (!applyRateLimit(req, res, {
    keyPrefix: 'auth:email-sign-in:ip',
    max: 30,
    windowMs: 15 * 60 * 1000,
  })) {
    return;
  }

  try {
    const payload = await readJsonBody(req, { limitBytes: 4 * 1024 });
    const email = normalizeEmail(payload.email);

    if (!applyRateLimitForKey(res, `auth:email-sign-in:email:${hashIdentifier(email)}`, {
      max: 8,
      windowMs: 15 * 60 * 1000,
    })) {
      return;
    }

    const result = await signInWithEmailPassword({
      email,
      password: payload.password,
    });

    sendJson(res, 200, {
      customToken: result.customToken,
      user: {
        uid: result.uid,
        email: result.email,
        displayName: result.displayName,
      },
    });
  } catch (error) {
    const safe = getPublicFirebaseAuthError(error, 'Sign in failed.');
    sendJson(res, safe.status, { error: safe.message });
  }
};
