const DISABLED_MESSAGE =
  'AI is not available from this Vercel site. Configure EXPO_PUBLIC_BACKEND_BASE_URL to the MoneyKai backend origin with AI enabled.';

const disabledProviderStatus = () => ({
  enabled: false,
  provider: 'moneykai-backend',
  baseUrl: '',
  defaultTextModel: '',
  defaultVisionModelConfigured: false,
  defaultFileModel: '',
  attachmentsEnabled: false,
  modelOverrideEnabled: false,
  configured: false,
  error: DISABLED_MESSAGE,
});

const disabledModel = (key, reason = DISABLED_MESSAGE) => ({
  key,
  model: null,
  canonicalSlug: null,
  configured: false,
  available: false,
  inputModalities: [],
  outputModalities: [],
  supportedParameters: [],
  expirationDate: null,
  deprecationState: 'active',
  reason,
});

const disabledModels = () => [
  disabledModel('text'),
  disabledModel('vision'),
  disabledModel('file'),
  disabledModel('reasoning'),
  disabledModel('sms_parse'),
];

const disabledModelStatus = () => ({
  models: disabledModels(),
  discoveryOk: false,
  discoverySource: 'fallback',
  discoveryError: DISABLED_MESSAGE,
});

const disabledOpsStatus = () => ({
  generatedAt: new Date().toISOString(),
  limiterBackend: 'disabled',
  counters: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    quotaRejectedRequests: 0,
    activeStreamRequests: 0,
  },
  recentErrorCodes: {},
  recentQuotaRejections: 0,
  lastErrorCode: null,
  attachmentCleanup: {
    lastRunAt: null,
    deletedAttachments: 0,
    failedRuns: 0,
  },
  alerts: [
    {
      code: 'AI_BACKEND_NOT_CONFIGURED',
      severity: 'warning',
      message: DISABLED_MESSAGE,
    },
  ],
  ...disabledModelStatus(),
});

const disabledActionPayload = () => ({
  error: {
    code: 'AI_BACKEND_NOT_CONFIGURED',
    message: DISABLED_MESSAGE,
  },
});

module.exports = {
  DISABLED_MESSAGE,
  disabledActionPayload,
  disabledModelStatus,
  disabledOpsStatus,
  disabledProviderStatus,
};
