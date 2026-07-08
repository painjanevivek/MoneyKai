const assert = require('node:assert/strict');
const test = require('node:test');

const { requireTrustedOrigin } = require('./http');

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

test('allows localhost browser origins on any port outside production', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'development';
    const response = createResponse();

    assert.equal(
      requireTrustedOrigin({
        headers: {
          origin: 'http://localhost:19006',
          host: 'localhost:3000',
        },
      }, response),
      true
    );
    assert.equal(response.statusCode, null);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});

test('allows same-origin production API requests without extra env configuration', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    const response = createResponse();

    assert.equal(
      requireTrustedOrigin({
        headers: {
          origin: 'https://moneykai.example',
          'x-forwarded-host': 'moneykai.example',
          'x-forwarded-proto': 'https',
        },
      }, response),
      true
    );
    assert.equal(response.statusCode, null);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});

test('rejects cross-site production origins', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    const response = createResponse();

    assert.equal(
      requireTrustedOrigin({
        headers: {
          origin: 'https://attacker.example',
          'x-forwarded-host': 'moneykai.example',
          'x-forwarded-proto': 'https',
        },
      }, response),
      false
    );
    assert.equal(response.statusCode, 403);
    assert.match(response.body, /Request origin is not trusted/);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});
