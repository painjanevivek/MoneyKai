const { requireMethod, sendJson } = require('../../../_lib/http');
const { disabledConnectStart } = require('../../../_lib/linked-accounts-disabled');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  return sendJson(res, 503, disabledConnectStart());
};
