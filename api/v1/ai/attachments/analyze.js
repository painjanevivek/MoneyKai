const { applyRateLimit, readJsonBody, requireMethod, sendJson } = require('../../../_lib/http');
const { analyzeInlineImages } = require('../../../_lib/ai-runtime');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }
  if (!applyRateLimit(req, res, { keyPrefix: 'ai:attachments:analyze', max: 12, windowMs: 60 * 1000 })) {
    return;
  }

  try {
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
    return sendJson(res, error.statusCode || 500, {
      error: {
        code: error.code || 'AI_ATTACHMENT_ANALYSIS_FAILED',
        message: error.message || 'Unable to analyse this attachment.',
      },
    });
  }
};
