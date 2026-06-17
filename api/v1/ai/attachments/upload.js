const { verifyFirebaseIdToken } = require('../../../_lib/firebase-auth');
const { getBearerToken, requireMethod, sendJson } = require('../../../_lib/http');
const {
  ATTACHMENT_TTL_MS,
  createAttachmentToken,
  parseMultipartFormData,
  validateAttachmentUpload,
} = require('../../../_lib/ai');
const { captureServerException } = require('../../../_lib/sentry');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  try {
    const token = getBearerToken(req);
    const user = await verifyFirebaseIdToken(token);
    const file = await parseMultipartFormData(req);
    validateAttachmentUpload(file);

    const attachmentId = createAttachmentToken({
      userId: user.uid,
      filename: file.filename,
      mimeType: file.mimeType,
      buffer: file.buffer,
    });

    return sendJson(res, 200, {
      attachmentId,
      kind: 'image',
      filename: file.filename,
      mimeType: file.mimeType,
      sizeBytes: file.buffer.length,
      expiresAt: new Date(Date.now() + ATTACHMENT_TTL_MS).toISOString(),
    });
  } catch (error) {
    await captureServerException(error, {
      tags: { feature: 'ai_attachments', route: '/api/v1/ai/attachments/upload' },
    });
    return sendJson(res, error.statusCode || 401, {
      error: error.message || 'Unable to upload the attachment for AI review.',
    });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
