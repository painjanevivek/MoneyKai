const { enforceCooldown } = require('../../../_lib/cooldown');
const { verifyFirebaseIdToken } = require('../../../_lib/firebase-auth');
const { applyRateLimit, getBearerToken, readJsonBody, requireMethod, sendJson } = require('../../../_lib/http');
const { analyzeInlineImages } = require('../../../_lib/ai-runtime');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }
  if (!(await applyRateLimit(req, res, { keyPrefix: 'ai:attachments:analyze', max: 12, windowMs: 60 * 1000 }))) {
    return;
  }

  try {
    const token = getBearerToken(req);
    const user = await verifyFirebaseIdToken(token);

    if (!(await enforceCooldown(res, {
      action: 'ai-attachment-analysis',
      identifierType: 'uid',
      identifier: user.uid,
      ttlSeconds: 30,
      message: 'Please wait a moment before requesting another attachment analysis.',
    }))) {
      return;
    }

    const payload = await readJsonBody(req, { limitBytes: 6 * 1024 * 1024 });
    if (!Array.isArray(payload.inlineAttachments) || payload.inlineAttachments.length === 0) {
      return sendJson(res, 400, {
        error: {
          code: 'AI_ATTACHMENT_REQUIRED',
          message: 'Attach an image before requesting analysis.',
        },
      });
    }

    const result = await analyzeInlineImages({
      task: payload.task === 'image_analysis' ? 'image_analysis' : 'receipt_extract',
      message: payload.message,
      inlineAttachments: payload.inlineAttachments,
    });
    return sendJson(res, 200, result);
  } catch (error) {
    const status = [400, 413, 503].includes(error.statusCode) ? error.statusCode : 401;
    const message =
      status === 401
        ? 'Sign in again before requesting attachment analysis.'
        : error.message || 'Unable to analyse this attachment.';

    return sendJson(res, status, {
      error: {
        code: error.code || 'AI_ATTACHMENT_ANALYSIS_FAILED',
        message,
      },
    });
  }
};
