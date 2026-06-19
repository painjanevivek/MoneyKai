const { requireMethod, sendJson } = require('../../../_lib/http');
const { disabledModelStatus } = require('../../../_lib/ai-disabled');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  return sendJson(res, 200, disabledModelStatus());
};
