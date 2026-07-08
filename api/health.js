const { applySecurityHeaders, requireMethod, sendJson } = require('./_lib/http');
const {
  getHealthPayload,
  renderHealthHtml,
  wantsHtml,
} = require('./_lib/backend-health');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  const payload = getHealthPayload();

  if (!wantsHtml(req)) {
    sendJson(res, 200, payload);
    return;
  }

  applySecurityHeaders(res);
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
  );
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(renderHealthHtml(payload));
};
