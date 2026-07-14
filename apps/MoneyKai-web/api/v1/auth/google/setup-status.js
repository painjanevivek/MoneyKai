const {
  applyRateLimit,
  requireMethod,
  sendJson,
} = require('../../../_lib/http');
const { getGoogleOAuthSetupStatus } = require('../../../_lib/google-oauth');

const getHeaderValue = (value) => {
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
};

const getRequestHostOrigin = (req) => {
  const host = getHeaderValue(req.headers['x-forwarded-host']) || getHeaderValue(req.headers.host);
  if (!host) {
    return '';
  }

  const proto = (getHeaderValue(req.headers['x-forwarded-proto']) || 'https').split(',')[0].trim();
  return `${proto}://${host.split(',')[0].trim()}`;
};

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  if (!(await applyRateLimit(req, res, {
    keyPrefix: 'auth:google-setup-status:ip',
    max: 30,
    windowMs: 15 * 60 * 1000,
  }))) {
    return;
  }

  sendJson(res, 200, getGoogleOAuthSetupStatus({
    requestHostOrigin: getRequestHostOrigin(req),
  }));
};
