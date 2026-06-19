const { requireMethod, sendJson } = require('../../../_lib/http');
const { disabledActionPayload } = require('../../../_lib/ai-disabled');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  return sendJson(res, 503, disabledActionPayload());
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
