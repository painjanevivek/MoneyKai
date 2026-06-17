const { requireMethod, sendJson } = require('../../../_lib/http');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  return sendJson(res, 410, {
    error: 'AI attachments now run through the MoneyKai backend. Set EXPO_PUBLIC_BACKEND_BASE_URL to the FastAPI backend origin.',
  });
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
