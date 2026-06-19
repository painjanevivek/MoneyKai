const { requireMethod, sendJson } = require('../../_lib/http');
const { disabledAttachmentQueue } = require('../../_lib/gmail-disabled');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  return sendJson(res, 503, disabledAttachmentQueue());
};
