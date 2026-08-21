const assert = require('node:assert/strict');
const test = require('node:test');

const { changeEmailPassword } = require('./firebase-identity');

test('changes an email-password account only after Firebase verifies the current password', async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.FIREBASE_WEB_API_KEY;
  const requests = [];

  process.env.FIREBASE_WEB_API_KEY = 'test-api-key';
  global.fetch = async (url, init) => {
    requests.push({ url, body: JSON.parse(init.body) });

    if (requests.length === 1) {
      return {
        ok: true,
        json: async () => ({
          localId: 'user-123',
          email: 'person@example.com',
          idToken: 'reauthenticated-id-token',
        }),
      };
    }

    return {
      ok: true,
      json: async () => ({ email: 'person@example.com' }),
    };
  };

  try {
    const result = await changeEmailPassword({
      email: ' Person@Example.com ',
      currentPassword: 'current-password',
      newPassword: 'new-password',
    });

    assert.deepEqual(result, { uid: 'user-123', email: 'person@example.com' });
    assert.match(requests[0].url, /accounts:signInWithPassword/);
    assert.deepEqual(requests[0].body, {
      email: 'person@example.com',
      password: 'current-password',
      returnSecureToken: true,
    });
    assert.match(requests[1].url, /accounts:update/);
    assert.deepEqual(requests[1].body, {
      idToken: 'reauthenticated-id-token',
      password: 'new-password',
      returnSecureToken: true,
    });
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.FIREBASE_WEB_API_KEY;
    } else {
      process.env.FIREBASE_WEB_API_KEY = originalApiKey;
    }
  }
});

test('rejects an invalid replacement password before calling Firebase', async () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.FIREBASE_WEB_API_KEY;
  let requestCount = 0;

  process.env.FIREBASE_WEB_API_KEY = 'test-api-key';
  global.fetch = async () => {
    requestCount += 1;
    throw new Error('Firebase should not be called');
  };

  try {
    await assert.rejects(
      () => changeEmailPassword({
        email: 'person@example.com',
        currentPassword: 'current-password',
        newPassword: 'short',
      }),
      /between 8 and 128 characters/
    );
    assert.equal(requestCount, 0);
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.FIREBASE_WEB_API_KEY;
    } else {
      process.env.FIREBASE_WEB_API_KEY = originalApiKey;
    }
  }
});
