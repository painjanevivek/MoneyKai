const { verifyFirebaseIdToken } = require('../../../_lib/firebase-auth');
const { getBearerToken, requireMethod, sendJson } = require('../../../_lib/http');
const { getProviderStatus } = require('../../../_lib/ai');
const { captureServerException } = require('../../../_lib/sentry');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  try {
    const token = getBearerToken(req);
    await verifyFirebaseIdToken(token);
    return sendJson(res, 200, getProviderStatus());
  } catch (error) {
    await captureServerException(error, {
      tags: { feature: 'ai_attachments', route: '/api/v1/ai/providers/status' },
    });
    return sendJson(res, 401, {
      error: 'Sign in again before checking AI attachment status.',
    });
  }
};
