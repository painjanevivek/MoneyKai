const { requireMethod, sendJson } = require('../../_lib/http');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  return sendJson(res, 200, { disconnected: true });
};
