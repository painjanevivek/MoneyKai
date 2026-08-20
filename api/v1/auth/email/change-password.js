const {
  applyRateLimit,
  applyRateLimitForKey,
  readJsonBody,
  requireMethod,
  sendJson,
} = require('../../../_lib/http');
const {
  changeEmailPassword,
  getPublicFirebaseAuthError,
  hashIdentifier,
  normalizeEmail,
} = require('../../../_lib/firebase-identity');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  if (!(await applyRateLimit(req, res, {
    keyPrefix: 'auth:email-password-change:ip',
    max: 8,
    windowMs: 15 * 60 * 1000,
    requireDistributed: process.env.NODE_ENV === 'production',
  }))) {
    return;
  }

  try {
    const payload = await readJsonBody(req, { limitBytes: 4 * 1024 });
    const email = normalizeEmail(payload.email);

    if (!(await applyRateLimitForKey(res, `auth:email-password-change:email:${hashIdentifier(email)}`, {
      max: 5,
      windowMs: 15 * 60 * 1000,
      requireDistributed: process.env.NODE_ENV === 'production',
    }))) {
      return;
    }

    await changeEmailPassword({
      email,
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    });

    sendJson(res, 200, { ok: true });
  } catch (error) {
    const safe = getPublicFirebaseAuthError(error, 'Password change failed.');
    sendJson(res, safe.status, { error: safe.message });
  }
};
