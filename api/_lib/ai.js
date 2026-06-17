const crypto = require('node:crypto');
const { readRawBodyBuffer } = require('./http');

const MAX_ATTACHMENT_BYTES = Number(process.env.MONEYKAI_AI_MAX_ATTACHMENT_BYTES || 3 * 1024 * 1024);
const ATTACHMENT_TTL_MS = Number(process.env.MONEYKAI_AI_ATTACHMENT_TTL_MS || 10 * 60 * 1000);
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const getOpenAiApiKey = () =>
  process.env.OPENAI_API_KEY || process.env.MONEYKAI_OPENAI_API_KEY || '';

const getVisionModel = () =>
  process.env.OPENAI_VISION_MODEL || process.env.MONEYKAI_AI_VISION_MODEL || 'gpt-4.1-mini';

const getTextModel = () =>
  process.env.OPENAI_TEXT_MODEL || process.env.MONEYKAI_AI_TEXT_MODEL || getVisionModel();

const getTokenSecret = () =>
  process.env.AI_ATTACHMENT_TOKEN_SECRET ||
  process.env.MONEYKAI_AI_ATTACHMENT_TOKEN_SECRET ||
  process.env.OPENAI_API_KEY ||
  process.env.SENTRY_DSN ||
  '';

const isAiConfigured = () => Boolean(getOpenAiApiKey() && getVisionModel());

const getProviderStatus = () => {
  const configured = isAiConfigured();
  return {
    enabled: configured,
    provider: 'openai',
    baseUrl: OPENAI_RESPONSES_URL,
    defaultTextModel: getTextModel(),
    defaultVisionModelConfigured: configured,
    defaultFileModel: getVisionModel(),
    attachmentsEnabled: configured,
    modelOverrideEnabled: false,
    configured,
  };
};

const createRequestId = () => `ai_${crypto.randomBytes(12).toString('hex')}`;

const toBase64Url = (value) => Buffer.from(value).toString('base64url');

const fromBase64Url = (value) => Buffer.from(value, 'base64url').toString('utf8');

const signPayload = (payload) => {
  const secret = getTokenSecret();
  if (!secret) {
    throw Object.assign(new Error('AI attachment token signing is not configured.'), { statusCode: 503 });
  }

  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
};

const createAttachmentToken = ({ userId, filename, mimeType, buffer }) => {
  const payload = toBase64Url(JSON.stringify({
    v: 1,
    uid: userId,
    filename,
    mimeType,
    sizeBytes: buffer.length,
    data: buffer.toString('base64'),
    expiresAt: Date.now() + ATTACHMENT_TTL_MS,
  }));
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
};

const parseAttachmentToken = (token, userId) => {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) {
    throw Object.assign(new Error('Attachment is invalid. Upload it again.'), { statusCode: 400 });
  }

  const expectedSignature = signPayload(payload);
  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw Object.assign(new Error('Attachment could not be verified. Upload it again.'), { statusCode: 400 });
  }

  const parsed = JSON.parse(fromBase64Url(payload));
  if (parsed.uid !== userId) {
    throw Object.assign(new Error('Attachment belongs to a different signed-in session.'), { statusCode: 403 });
  }

  if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
    throw Object.assign(new Error('Attachment review expired. Upload it again.'), { statusCode: 410 });
  }

  if (!SUPPORTED_IMAGE_MIME_TYPES.has(parsed.mimeType)) {
    throw Object.assign(new Error('Choose a JPEG, PNG, or WebP image.'), { statusCode: 400 });
  }

  return {
    filename: parsed.filename,
    mimeType: parsed.mimeType,
    sizeBytes: parsed.sizeBytes,
    buffer: Buffer.from(parsed.data, 'base64'),
  };
};

const parseContentDisposition = (value) => {
  const result = {};
  for (const part of value.split(';').map((entry) => entry.trim())) {
    const [key, rawValue] = part.split('=');
    if (!rawValue) {
      continue;
    }
    result[key.toLowerCase()] = rawValue.replace(/^"|"$/g, '');
  }
  return result;
};

const parseMultipartFormData = async (req) => {
  const contentType = req.headers['content-type'] || '';
  const boundary = contentType.match(/boundary=([^;]+)/i)?.[1]?.replace(/^"|"$/g, '');
  if (!boundary) {
    throw Object.assign(new Error('Upload must use multipart/form-data.'), { statusCode: 400 });
  }

  const rawBuffer = await readRawBodyBuffer(req, { limitBytes: MAX_ATTACHMENT_BYTES + 1024 * 1024 });
  const raw = rawBuffer.toString('latin1');
  const parts = raw.split(`--${boundary}`);

  for (const part of parts) {
    const normalized = part.replace(/^\r?\n/, '');
    if (!normalized || normalized === '--\r\n' || normalized === '--') {
      continue;
    }

    const headerBoundary = normalized.indexOf('\r\n\r\n');
    if (headerBoundary < 0) {
      continue;
    }

    const headerText = normalized.slice(0, headerBoundary);
    const bodyText = normalized.slice(headerBoundary + 4).replace(/\r\n--$/, '').replace(/\r\n$/, '');
    const headers = Object.fromEntries(
      headerText.split(/\r?\n/).map((line) => {
        const index = line.indexOf(':');
        return [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()];
      }),
    );
    const disposition = parseContentDisposition(headers['content-disposition'] || '');

    if (disposition.name !== 'file') {
      continue;
    }

    const buffer = Buffer.from(bodyText, 'latin1');
    const mimeType = (headers['content-type'] || 'application/octet-stream').toLowerCase();
    const filename = disposition.filename || `moneykai-${Date.now()}`;
    return { buffer, filename, mimeType };
  }

  throw Object.assign(new Error('Attach an image file before requesting AI review.'), { statusCode: 400 });
};

const validateAttachmentUpload = (file) => {
  if (!SUPPORTED_IMAGE_MIME_TYPES.has(file.mimeType)) {
    throw Object.assign(new Error('Choose a JPEG, PNG, or WebP image.'), { statusCode: 400 });
  }

  if (file.buffer.length === 0) {
    throw Object.assign(new Error('The selected image is empty.'), { statusCode: 400 });
  }

  if (file.buffer.length > MAX_ATTACHMENT_BYTES) {
    throw Object.assign(new Error(`Image must be smaller than ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)} MB.`), {
      statusCode: 413,
    });
  }
};

const extractOutputText = (response) => {
  if (typeof response.output_text === 'string') {
    return response.output_text;
  }

  const message = response.output?.find((item) => item.type === 'message');
  const textPart = message?.content?.find((item) => item.type === 'output_text' || item.type === 'text');
  return textPart?.text || '';
};

const parseAiJson = (value) => {
  const trimmed = value.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) {
      return JSON.parse(fenced);
    }
    throw Object.assign(new Error('AI returned an unreadable attachment review.'), { statusCode: 502 });
  }
};

const normalizeStructured = (value) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const amount = Number(value.amount);
  return {
    merchant: typeof value.merchant === 'string' && value.merchant.trim() ? value.merchant.trim() : null,
    date: typeof value.date === 'string' && value.date.trim() ? value.date.trim() : null,
    amount: Number.isFinite(amount) && amount > 0 ? amount : null,
    currency: typeof value.currency === 'string' && value.currency.trim() ? value.currency.trim().toUpperCase() : null,
    category: typeof value.category === 'string' && value.category.trim() ? value.category.trim() : null,
  };
};

const buildAttachmentPrompt = ({ task, message, filename }) => {
  const taskInstruction = task === 'receipt_extract'
    ? 'Extract receipt details if visible: merchant, transaction date, total amount, currency, and likely spending category.'
    : 'Describe what is visible in the image and highlight details the user should review.';

  return [
    'You are MoneyKai, a privacy-focused personal finance assistant.',
    'Analyze the uploaded image only for user review. Never claim that a transaction was saved.',
    'Return concise JSON only. No markdown.',
    taskInstruction,
    `Filename: ${filename}`,
    `User request: ${message || 'Review this image.'}`,
    'Use null for any receipt field that is not clearly visible. Add warnings for uncertainty, blurry images, or missing fields.',
  ].join('\n');
};

const callOpenAiAttachmentAnalysis = async ({ attachment, message, task }) => {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw Object.assign(new Error('AI attachments are not configured. Set OPENAI_API_KEY on the backend.'), {
      statusCode: 503,
    });
  }

  const requestId = createRequestId();
  const model = getVisionModel();
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildAttachmentPrompt({ task, message, filename: attachment.filename }),
            },
            {
              type: 'input_image',
              image_url: `data:${attachment.mimeType};base64,${attachment.buffer.toString('base64')}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'moneykai_attachment_review',
          strict: false,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['message', 'structured', 'warnings'],
            properties: {
              message: { type: 'string' },
              structured: {
                type: ['object', 'null'],
                additionalProperties: false,
                properties: {
                  merchant: { type: ['string', 'null'] },
                  date: { type: ['string', 'null'] },
                  amount: { type: ['number', 'null'] },
                  currency: { type: ['string', 'null'] },
                  category: { type: ['string', 'null'] },
                },
              },
              warnings: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      },
      max_output_tokens: 900,
      store: false,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.message || `AI provider returned ${response.status}.`;
    throw Object.assign(new Error(message), { statusCode: response.status >= 500 ? 502 : response.status });
  }

  const parsed = parseAiJson(extractOutputText(payload));
  return {
    requestId: payload.id || requestId,
    message: typeof parsed.message === 'string' ? parsed.message : 'Review the image details before using them in MoneyKai.',
    structured: task === 'receipt_extract' ? normalizeStructured(parsed.structured) : null,
    reviewRequired: true,
    model,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.filter((item) => typeof item === 'string') : [],
  };
};

module.exports = {
  ATTACHMENT_TTL_MS,
  callOpenAiAttachmentAnalysis,
  createAttachmentToken,
  getProviderStatus,
  isAiConfigured,
  parseAttachmentToken,
  parseMultipartFormData,
  validateAttachmentUpload,
};
