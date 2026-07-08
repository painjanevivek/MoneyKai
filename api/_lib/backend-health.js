const SERVICE_NAME = 'MoneyKai Backend';
const HEALTH_ENDPOINTS = [
  '/api/health',
  '/api/v1/auth/google/setup-status',
  '/api/v1/auth/google/start',
];

const getHealthPayload = () => ({
  ok: true,
  service: SERVICE_NAME,
  status: 'healthy',
  timestamp: new Date().toISOString(),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
  deployment: {
    url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    region: process.env.VERCEL_REGION || '',
  },
  endpoints: HEALTH_ENDPOINTS,
});

const wantsHtml = (req) => {
  const accept = req.headers.accept || '';
  return typeof accept === 'string' && accept.includes('text/html');
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const renderHealthHtml = (payload) => {
  const endpointLinks = payload.endpoints
    .map((endpoint) => `<li><a href="${escapeHtml(endpoint)}">${escapeHtml(endpoint)}</a></li>`)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(payload.service)} Health</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0b0d10;
      color: #eef4ff;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 32px;
    }
    main {
      width: min(720px, 100%);
      border: 1px solid #223049;
      border-radius: 18px;
      background: #10141b;
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.32);
      padding: 32px;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: #a8f0c6;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      font-size: 13px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #49d17d;
      box-shadow: 0 0 0 6px rgba(73, 209, 125, 0.12);
    }
    h1 {
      margin: 18px 0 10px;
      font-size: clamp(32px, 5vw, 48px);
      line-height: 1;
    }
    p {
      color: #aab6ca;
      line-height: 1.7;
      margin: 0 0 24px;
    }
    dl {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 12px 18px;
      margin: 0 0 28px;
    }
    dt {
      color: #76839a;
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    ul {
      margin: 0;
      padding-left: 20px;
      line-height: 1.9;
    }
    a {
      color: #a8edff;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <main>
    <div class="status"><span class="dot"></span>${escapeHtml(payload.status)}</div>
    <h1>${escapeHtml(payload.service)}</h1>
    <p>The backend is reachable. Use the endpoints below for machine-readable health and auth setup checks.</p>
    <dl>
      <dt>Checked</dt>
      <dd>${escapeHtml(payload.timestamp)}</dd>
      <dt>Environment</dt>
      <dd>${escapeHtml(payload.environment)}</dd>
      <dt>Deployment</dt>
      <dd>${escapeHtml(payload.deployment.url || 'not reported')}</dd>
    </dl>
    <ul>${endpointLinks}</ul>
  </main>
</body>
</html>`;
};

module.exports = {
  getHealthPayload,
  renderHealthHtml,
  wantsHtml,
};
