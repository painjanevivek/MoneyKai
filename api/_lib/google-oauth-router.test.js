const assert = require('node:assert/strict');
const test = require('node:test');

const googleOAuthRouter = require('./google-oauth-router');

test('Google OAuth dispatcher maps every public rewrite action', () => {
  for (const action of ['start', 'callback', 'exchange', 'setup-status']) {
    assert.equal(
      googleOAuthRouter.selectGoogleOAuthHandler(action),
      googleOAuthRouter.handlers[action],
    );
  }
});

test('Google OAuth dispatcher rejects unknown actions', async () => {
  const response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    send(body) {
      this.body = body;
    },
  };

  await googleOAuthRouter({ headers: {}, query: { action: 'unknown' } }, response);

  assert.equal(response.statusCode, 404);
  assert.deepEqual(JSON.parse(response.body), { error: 'Google auth route not found.' });
});
