const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getHealthPayload,
  renderHealthHtml,
  wantsHtml,
} = require('./backend-health');

test('backend health payload is non-secret and points to diagnostics', () => {
  const payload = getHealthPayload();

  assert.equal(payload.ok, true);
  assert.equal(payload.service, 'MoneyKai Web Edge');
  assert.equal(payload.status, 'healthy');
  assert.ok(payload.timestamp);
  assert.ok(payload.endpoints.includes('/api/health'));
  assert.ok(payload.endpoints.includes('/api/monitoring'));
  assert.equal(payload.endpoints.some((endpoint) => endpoint.startsWith('/api/v1/')), false);
  assert.equal(JSON.stringify(payload).includes('SECRET'), false);
});

test('backend health renders a small browser status page', () => {
  const html = renderHealthHtml({
    ...getHealthPayload(),
    timestamp: '2026-07-09T00:00:00.000Z',
    environment: 'production',
    deployment: { url: 'https://example.test', region: 'bom1' },
  });

  assert.match(html, /MoneyKai Web Edge/);
  assert.match(html, /healthy/);
  assert.match(html, /\/api\/monitoring/);
});

test('backend health detects browser HTML requests', () => {
  assert.equal(wantsHtml({ headers: { accept: 'text/html,application/xhtml+xml' } }), true);
  assert.equal(wantsHtml({ headers: { accept: 'application/json' } }), false);
});
