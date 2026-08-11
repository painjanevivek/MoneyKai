const assert = require('node:assert/strict');
const test = require('node:test');

const monitoringHandler = require('./monitoring');

const CONFIGURED_DSN = 'https://public-key@o123.ingest.sentry.io/456';

const createEnvelope = ({
  dsn = CONFIGURED_DSN,
  itemCount = 1,
  payload = '{"event_id":"abc"}',
} = {}) => {
  const parts = [JSON.stringify(dsn ? { dsn } : {})];
  for (let index = 0; index < itemCount; index += 1) {
    parts.push(JSON.stringify({ type: 'event', length: Buffer.byteLength(payload) }));
    parts.push(payload);
  }
  return Buffer.from(parts.join('\n'));
};

const createRequest = (body, address) => ({
  method: 'POST',
  url: '/api/monitoring',
  headers: { 'x-forwarded-for': address },
  socket: {},
  body,
});

const createResponse = () => ({
  headers: {},
  statusCode: null,
  body: null,
  setHeader(name, value) {
    this.headers[name] = value;
  },
  status(statusCode) {
    this.statusCode = statusCode;
    return {
      send: (body) => {
        this.body = body;
      },
    };
  },
});

const runWithMonitoringEnv = async (callback) => {
  const previousDsn = process.env.SENTRY_DSN;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousFetch = global.fetch;
  process.env.SENTRY_DSN = CONFIGURED_DSN;
  process.env.NODE_ENV = 'test';
  let fetchCalls = 0;
  let forwardedBody;
  global.fetch = async (_url, options) => {
    fetchCalls += 1;
    forwardedBody = options.body;
    return { ok: true, status: 200 };
  };

  try {
    await callback({
      fetchCalls: () => fetchCalls,
      forwardedBody: () => forwardedBody,
    });
  } finally {
    if (previousDsn === undefined) {
      delete process.env.SENTRY_DSN;
    } else {
      process.env.SENTRY_DSN = previousDsn;
    }
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
    global.fetch = previousFetch;
  }
};

test('relays a bounded Sentry envelope bound to the configured project', async () => {
  await runWithMonitoringEnv(async ({ fetchCalls, forwardedBody }) => {
    const envelope = createEnvelope();
    const response = createResponse();

    await monitoringHandler(createRequest(envelope, '203.0.113.61'), response);

    assert.equal(response.statusCode, 200);
    assert.equal(fetchCalls(), 1);
    assert.deepEqual(forwardedBody(), envelope);
  });
});

test('rejects envelopes without a DSN instead of relaying them', async () => {
  await runWithMonitoringEnv(async ({ fetchCalls }) => {
    const response = createResponse();

    await monitoringHandler(
      createRequest(createEnvelope({ dsn: null }), '203.0.113.62'),
      response,
    );

    assert.equal(response.statusCode, 403);
    assert.equal(fetchCalls(), 0);
  });
});

test('rejects envelopes bound to another Sentry project', async () => {
  await runWithMonitoringEnv(async ({ fetchCalls }) => {
    const response = createResponse();

    await monitoringHandler(
      createRequest(
        createEnvelope({ dsn: 'https://public-key@o123.ingest.sentry.io/999' }),
        '203.0.113.65',
      ),
      response,
    );

    assert.equal(response.statusCode, 403);
    assert.equal(fetchCalls(), 0);
  });
});

test('rejects envelopes with more than twenty items', async () => {
  await runWithMonitoringEnv(async ({ fetchCalls }) => {
    const response = createResponse();

    await monitoringHandler(
      createRequest(createEnvelope({ itemCount: 21 }), '203.0.113.63'),
      response,
    );

    assert.equal(response.statusCode, 400);
    assert.equal(fetchCalls(), 0);
  });
});

test('rejects monitoring envelopes above 256 KiB before relay', async () => {
  await runWithMonitoringEnv(async ({ fetchCalls }) => {
    const response = createResponse();

    await monitoringHandler(
      createRequest(createEnvelope({ payload: 'x'.repeat(300 * 1024) }), '203.0.113.64'),
      response,
    );

    assert.equal(response.statusCode, 413);
    assert.equal(fetchCalls(), 0);
  });
});
