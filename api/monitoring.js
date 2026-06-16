const { applySecurityHeaders, readRawBody, requireMethod, sendJson } = require('./_lib/http');

const isSentryHost = (hostname) =>
  hostname === 'sentry.io' || hostname.endsWith('.sentry.io');

const parseDsn = (dsn) => {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+/, '').split('/').pop();
    if (!projectId || !isSentryHost(url.hostname)) {
      return null;
    }
    return {
      envelopeUrl: `${url.protocol}//${url.hostname}${url.pathname.replace(/\/[^/]*$/, '')}/api/${projectId}/envelope/`,
      host: url.hostname,
      publicKey: url.username,
    };
  } catch {
    return null;
  }
};

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'POST')) {
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    const envelopeHeader = JSON.parse(rawBody.split('\n', 1)[0] || '{}');
    const configured = parseDsn(process.env.SENTRY_DSN || process.env.EXPO_PUBLIC_SENTRY_DSN);
    const envelopeDsn = envelopeHeader.dsn ? parseDsn(envelopeHeader.dsn) : null;

    if (!configured) {
      return sendJson(res, 400, { error: 'Invalid Sentry DSN for monitoring tunnel.' });
    }

    if (envelopeDsn && envelopeDsn.publicKey !== configured.publicKey) {
      return sendJson(res, 403, { error: 'Sentry envelope DSN is not allowed.' });
    }

    const response = await fetch(configured.envelopeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      body: rawBody,
    });

    if (!response.ok) {
      return sendJson(res, response.status, { error: `Sentry ingest returned ${response.status}.` });
    }

    applySecurityHeaders(res);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send('');
  } catch (error) {
    return sendJson(res, error.statusCode || 400, { error: error.message || 'Unable to relay Sentry envelope.' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
