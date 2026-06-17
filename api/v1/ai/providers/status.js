const { requireMethod, sendJson } = require('../../../_lib/http');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  return sendJson(res, 410, {
    enabled: false,
    configured: false,
    attachmentsEnabled: false,
    error: 'AI provider status now runs through the MoneyKai backend. Set EXPO_PUBLIC_BACKEND_BASE_URL to the FastAPI backend origin.',
  });
};
