const { requireMethod, sendJson } = require('../../_lib/http');
const { emptyEmailList } = require('../../_lib/gmail-disabled');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  return sendJson(res, 200, emptyEmailList());
};
