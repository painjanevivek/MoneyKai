const { requireMethod, sendJson } = require('../../../_lib/http');
const { providerStatus } = require('../../../_lib/ai-runtime');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  return sendJson(res, 200, providerStatus());
};
