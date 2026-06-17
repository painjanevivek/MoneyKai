const { verifyFirebaseIdToken } = require('../../../_lib/firebase-auth');
const { getBearerToken, readJsonBody, requireMethod, sendJson } = require('../../../_lib/http');
const { callOpenAiAttachmentAnalysis, parseAttachmentToken } = require('../../../_lib/ai');
const { captureServerException } = require('../../../_lib/sentry');

const VALID_TASKS = new Set(['receipt_extract', 'image_analysis']);

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  try {
    const token = getBearerToken(req);
    const user = await verifyFirebaseIdToken(token);
    const body = await readJsonBody(req, { limitBytes: 8 * 1024 * 1024 });
    const attachmentId = body.attachmentIds?.[0];
    const task = VALID_TASKS.has(body.task) ? body.task : 'receipt_extract';

    if (!attachmentId) {
      return sendJson(res, 400, { error: 'Upload an attachment before requesting AI review.' });
    }

    const attachment = parseAttachmentToken(attachmentId, user.uid);
    const analysis = await callOpenAiAttachmentAnalysis({
      attachment,
      message: typeof body.message === 'string' ? body.message.slice(0, 2000) : '',
      task,
    });

    return sendJson(res, 200, analysis);
  } catch (error) {
    await captureServerException(error, {
      tags: { feature: 'ai_attachments', route: '/api/v1/ai/attachments/analyze' },
    });
    return sendJson(res, error.statusCode || 500, {
      error: error.message || 'Unable to analyze the attachment right now.',
    });
  }
};
