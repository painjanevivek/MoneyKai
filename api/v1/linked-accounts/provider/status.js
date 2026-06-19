const { requireMethod, sendJson } = require('../../../_lib/http');
const { disabledProviderStatus } = require('../../../_lib/linked-accounts-disabled');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  return sendJson(res, 200, disabledProviderStatus());
};
