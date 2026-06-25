const {
  applyRateLimit,
  applyRateLimitForKey,
  readJsonBody,
  requireMethod,
  sendJson,
} = require('../../../_lib/http');
const {
  FirebaseIdentityError,
  getPublicFirebaseAuthError,
  hashIdentifier,
  normalizeEmail,
  sendPasswordResetEmail,
} = require('../../../_lib/firebase-identity');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  if (!applyRateLimit(req, res, {
    keyPrefix: 'auth:password-reset:ip',
    max: 20,
    windowMs: 60 * 60 * 1000,
  })) {
    return;
  }

  try {
    const payload = await readJsonBody(req, { limitBytes: 2 * 1024 });
    const email = normalizeEmail(payload.email);

    if (!applyRateLimitForKey(res, `auth:password-reset:email:${hashIdentifier(email)}`, {
      max: 5,
      windowMs: 60 * 60 * 1000,
    })) {
      return;
    }

    await sendPasswordResetEmail({ email });
    sendJson(res, 202, { ok: true });
  } catch (error) {
    if (error instanceof FirebaseIdentityError && error.code === 'INVALID_EMAIL') {
      sendJson(res, 400, { error: 'Enter a valid email address.' });
      return;
    }

    const safe = getPublicFirebaseAuthError(error, 'Could not send the reset link right now.');
    sendJson(res, safe.status >= 500 ? safe.status : 202, safe.status >= 500 ? { error: safe.message } : { ok: true });
  }
};
