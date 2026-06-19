const { requireMethod, sendJson } = require('../../../../_lib/http');
const { disabledZerodhaCallback } = require('../../../../_lib/portfolio-provider-disabled');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  return sendJson(res, 503, disabledZerodhaCallback());
};
