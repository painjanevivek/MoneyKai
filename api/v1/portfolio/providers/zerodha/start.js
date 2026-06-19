const { requireMethod, sendJson } = require('../../../../_lib/http');
const { disabledZerodhaStart } = require('../../../../_lib/portfolio-provider-disabled');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  return sendJson(res, 200, disabledZerodhaStart());
};
