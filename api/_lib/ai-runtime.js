const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_VISION_MODEL = 'google/gemini-2.0-flash-001';
const DEFAULT_TEXT_MODEL = 'google/gemini-2.0-flash-001';
const MAX_INLINE_IMAGE_BYTES = 4 * 1024 * 1024;

const getConfig = () => {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.MONEYKAI_OPENROUTER_API_KEY || '';
  const visionModel =
    process.env.MONEYKAI_AI_VISION_MODEL ||
    process.env.OPENROUTER_VISION_MODEL ||
    DEFAULT_VISION_MODEL;
  const textModel =
    process.env.MONEYKAI_AI_TEXT_MODEL ||
    process.env.OPENROUTER_TEXT_MODEL ||
    DEFAULT_TEXT_MODEL;

  return {
    apiKey,
    provider: 'openrouter',
    textModel,
    visionModel,
    configured: Boolean(apiKey),
    siteUrl: process.env.MONEYKAI_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://moneykai.com',
  };
};

const providerStatus = () => {
  const config = getConfig();
  return {
    enabled: config.configured,
    provider: config.provider,
    baseUrl: config.configured ? 'https://openrouter.ai' : '',
    defaultTextModel: config.configured ? config.textModel : '',
    defaultVisionModelConfigured: config.configured,
    defaultFileModel: '',
    attachmentsEnabled: config.configured,
    modelOverrideEnabled: false,
    configured: config.configured,
    error: config.configured
      ? null
      : 'Configure OPENROUTER_API_KEY on the backend to enable MoneyKai AI analysis.',
  };
};

const estimateDataUrlBytes = (dataUrl) => {
  const [, base64 = ''] = dataUrl.split(',');
  return Math.floor((base64.length * 3) / 4);
};

const normalizeInlineImages = (attachments) => {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments
    .map((attachment) => ({
      filename: typeof attachment?.filename === 'string' ? attachment.filename.slice(0, 160) : 'attachment',
      mimeType: typeof attachment?.mimeType === 'string' ? attachment.mimeType : '',
      dataUrl: typeof attachment?.dataUrl === 'string' ? attachment.dataUrl : '',
    }))
    .filter((attachment) => {
      if (!attachment.mimeType.startsWith('image/')) {
        return false;
      }
      if (!attachment.dataUrl.startsWith(`data:${attachment.mimeType};base64,`)) {
        return false;
      }
      return estimateDataUrlBytes(attachment.dataUrl) <= MAX_INLINE_IMAGE_BYTES;
    })
    .slice(0, 3);
};

const buildAnalysisInstructions = (task) => {
  if (task === 'receipt_extract') {
    return [
      'Analyse the attached image as a receipt only if it appears to be one.',
      'Return review-only information. Do not save, mutate, or imply financial advice.',
      'Start with a concise plain-English summary.',
      'If receipt fields are visible, include merchant, date as YYYY-MM-DD, amount as a number, currency, and likely spending category.',
      'Respond as JSON with keys: message, structured, warnings.',
      'structured may be null or an object with merchant, date, amount, currency, category.',
    ].join(' ');
  }

  return [
    'Analyse the attached image generally.',
    'Describe only what is visible or reasonably inferable.',
    'Keep the answer review-only and avoid financial, investment, tax, or legal advice.',
    'Respond as JSON with keys: message, structured, warnings. structured should be null.',
  ].join(' ');
};

const extractJsonObject = (text) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        return null;
      }
    }

    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }

  return null;
};

const normalizeWarnings = (warnings) =>
  Array.isArray(warnings)
    ? warnings.filter((warning) => typeof warning === 'string' && warning.trim()).slice(0, 5)
    : [];

const normalizeStructuredReceipt = (structured) => {
  if (!structured || typeof structured !== 'object') {
    return null;
  }

  const amount = Number(structured.amount);
  return {
    merchant: typeof structured.merchant === 'string' ? structured.merchant : null,
    date: typeof structured.date === 'string' ? structured.date : null,
    amount: Number.isFinite(amount) ? amount : null,
    currency: typeof structured.currency === 'string' ? structured.currency : null,
    category: typeof structured.category === 'string' ? structured.category : null,
  };
};

const analyzeInlineImages = async ({ task, message, inlineAttachments }) => {
  const config = getConfig();
  if (!config.configured) {
    const error = new Error('Configure OPENROUTER_API_KEY on the backend to enable MoneyKai AI analysis.');
    error.statusCode = 503;
    error.code = 'AI_BACKEND_NOT_CONFIGURED';
    throw error;
  }

  const images = normalizeInlineImages(inlineAttachments);
  if (images.length === 0) {
    const error = new Error('Attach a supported PNG, JPEG, WebP, or GIF image under 4 MB.');
    error.statusCode = 400;
    error.code = 'AI_ATTACHMENT_INVALID';
    throw error;
  }

  const prompt = [
    buildAnalysisInstructions(task),
    '',
    'User prompt:',
    typeof message === 'string' && message.trim() ? message.trim() : 'Analyse this image.',
  ].join('\n');

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': config.siteUrl,
      'X-OpenRouter-Title': 'MoneyKai',
    },
    body: JSON.stringify({
      model: config.visionModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...images.map((image) => ({
              type: 'image_url',
              image_url: {
                url: image.dataUrl,
                detail: 'auto',
              },
            })),
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 700,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `OpenRouter analysis failed with ${response.status}.`);
    error.statusCode = response.status;
    error.code = payload?.error?.code || 'AI_PROVIDER_REQUEST_FAILED';
    throw error;
  }

  const content = payload?.choices?.[0]?.message?.content;
  const text = typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.map((part) => part?.text).filter(Boolean).join('\n')
      : '';
  const parsed = extractJsonObject(text);
  const structured = task === 'receipt_extract' ? normalizeStructuredReceipt(parsed?.structured) : null;

  return {
    requestId: payload?.id || `ai_attach_${Date.now()}`,
    message: typeof parsed?.message === 'string' && parsed.message.trim() ? parsed.message.trim() : text.trim(),
    structured,
    reviewRequired: true,
    model: payload?.model || config.visionModel,
    warnings: normalizeWarnings(parsed?.warnings),
  };
};

module.exports = {
  analyzeInlineImages,
  providerStatus,
};
