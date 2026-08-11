const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const {
  buildGoogleAuthorizationUrl,
  createExchangeCode,
  consumeExchangeCode,
  getBackendGoogleRedirectUri,
  getGoogleOAuthSetupStatus,
} = require('./google-oauth');

const withEnv = (values, callback) => {
  const previous = {};
  for (const key of Object.keys(values)) {
    previous[key] = process.env[key];
    if (values[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = values[key];
    }
  }

  try {
    return callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

const withEnvAsync = async (values, callback) => {
  const previous = {};
  for (const key of Object.keys(values)) {
    previous[key] = process.env[key];
    if (values[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = values[key];
    }
  }

  try {
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
};

const createTestServiceAccountJson = () => {
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
  });

  return JSON.stringify({
    type: 'service_account',
    project_id: 'moneykai-test',
    private_key_id: 'test-key-id',
    private_key: privateKey,
    client_email: 'firebase-adminsdk-test@moneykai-test.iam.gserviceaccount.com',
    client_id: '123456789',
  });
};

test('resolves the canonical MoneyKai Google redirect URI from site config', () => {
  withEnv({
    GOOGLE_OAUTH_REDIRECT_URI: undefined,
    MONEYKAI_SITE_URL: 'https://moneykai.com',
    PUBLIC_SITE_URL: undefined,
    VERCEL_URL: undefined,
  }, () => {
    assert.equal(
      getBackendGoogleRedirectUri('https://moneykai.com'),
      'https://moneykai.com/api/v1/auth/google/callback'
    );
  });
});

test('prefers the trusted request host over deployment fallback for Google redirect URI', () => {
  withEnv({
    GOOGLE_OAUTH_REDIRECT_URI: undefined,
    MONEYKAI_SITE_URL: undefined,
    PUBLIC_SITE_URL: undefined,
    VERCEL_URL: 'moneykai-rbjqiyfz0-vivek-painjanes-projects.vercel.app',
  }, () => {
    assert.equal(
      getBackendGoogleRedirectUri('https://moneykai.com'),
      'https://moneykai.com/api/v1/auth/google/callback'
    );
  });
});

test('canonicalizes trusted www MoneyKai hosts to the registered production redirect URI', () => {
  withEnv({
    GOOGLE_OAUTH_REDIRECT_URI: undefined,
    MONEYKAI_SITE_URL: undefined,
    PUBLIC_SITE_URL: undefined,
    VERCEL_URL: 'moneykai-rbjqiyfz0-vivek-painjanes-projects.vercel.app',
  }, () => {
    assert.equal(
      getBackendGoogleRedirectUri('https://www.moneykai.com'),
      'https://moneykai.com/api/v1/auth/google/callback'
    );
  });
});

test('does not treat lookalike hosts as trusted MoneyKai production origins', () => {
  withEnv({
    GOOGLE_OAUTH_REDIRECT_URI: undefined,
    MONEYKAI_SITE_URL: 'https://moneykai.com',
    PUBLIC_SITE_URL: undefined,
    VERCEL_URL: undefined,
  }, () => {
    assert.equal(
      getBackendGoogleRedirectUri('https://moneykai.com.attacker.example'),
      'https://moneykai.com/api/v1/auth/google/callback'
    );
  });
});

test('uses explicit Google OAuth redirect URI when configured', () => {
  withEnv({
    GOOGLE_OAUTH_REDIRECT_URI: 'https://auth.moneykai.com/api/v1/auth/google/callback',
    MONEYKAI_SITE_URL: 'https://moneykai.com',
  }, () => {
    assert.equal(
      getBackendGoogleRedirectUri('https://moneykai.com'),
      'https://auth.moneykai.com/api/v1/auth/google/callback'
    );
  });
});

test('publishes non-secret Google OAuth setup status for deployment checks', () => {
  withEnv({
    GOOGLE_OAUTH_CLIENT_ID: 'client-id',
    GOOGLE_OAUTH_CLIENT_SECRET: 'client-secret',
    GOOGLE_OAUTH_STATE_SECRET: 'state-secret',
    GOOGLE_OAUTH_REDIRECT_URI: undefined,
    FIREBASE_SERVICE_ACCOUNT_JSON: createTestServiceAccountJson(),
    FIREBASE_CLIENT_EMAIL: undefined,
    FIREBASE_PRIVATE_KEY: undefined,
    FIREBASE_WEB_API_KEY: undefined,
    FIREBASE_API_KEY: undefined,
    EXPO_PUBLIC_FIREBASE_API_KEY: 'firebase-api-key',
    MONEYKAI_SITE_URL: 'https://moneykai.com',
    PUBLIC_SITE_URL: undefined,
    VERCEL_URL: undefined,
  }, () => {
    const status = getGoogleOAuthSetupStatus({ requestHostOrigin: 'https://moneykai.com' });

    assert.equal(status.configured, true);
    assert.equal(status.clientIdConfigured, true);
    assert.equal(status.clientSecretConfigured, true);
    assert.equal(status.stateSecretConfigured, true);
    assert.equal(status.firebaseApiKeyConfigured, true);
    assert.equal(status.firebaseApiKeyError, '');
    assert.equal(status.firebaseServiceAccountConfigured, true);
    assert.equal(status.firebaseServiceAccountValidShape, true);
    assert.equal(status.firebaseServiceAccountError, '');
    assert.equal(status.redirectUri, 'https://moneykai.com/api/v1/auth/google/callback');
    assert.deepEqual(status.requiredGoogleCloud.authorizedRedirectUris, [
      'https://moneykai.com/api/v1/auth/google/callback',
    ]);
    assert.equal(JSON.stringify(status).includes('client-secret'), false);
    assert.equal(JSON.stringify(status).includes('state-secret'), false);
    assert.equal(JSON.stringify(status).includes('BEGIN PRIVATE KEY'), false);
  });
});

test('reports Firebase setup gaps without exposing secret values', () => {
  withEnv({
    GOOGLE_OAUTH_CLIENT_ID: 'client-id',
    GOOGLE_OAUTH_CLIENT_SECRET: 'client-secret',
    GOOGLE_OAUTH_STATE_SECRET: 'state-secret',
    GOOGLE_OAUTH_REDIRECT_URI: undefined,
    FIREBASE_SERVICE_ACCOUNT_JSON: '{"client_email":"broken@example.com","private_key":"not-a-private-key"}',
    FIREBASE_CLIENT_EMAIL: undefined,
    FIREBASE_PRIVATE_KEY: undefined,
    FIREBASE_WEB_API_KEY: undefined,
    FIREBASE_API_KEY: undefined,
    EXPO_PUBLIC_FIREBASE_API_KEY: undefined,
    MONEYKAI_SITE_URL: 'https://moneykai.com',
    PUBLIC_SITE_URL: undefined,
    VERCEL_URL: undefined,
  }, () => {
    const status = getGoogleOAuthSetupStatus({ requestHostOrigin: 'https://moneykai.com' });

    assert.equal(status.configured, false);
    assert.equal(status.firebaseApiKeyConfigured, false);
    assert.equal(status.firebaseApiKeyError, 'FIREBASE_API_KEY_MISSING');
    assert.equal(status.firebaseServiceAccountConfigured, true);
    assert.equal(status.firebaseServiceAccountValidShape, false);
    assert.equal(status.firebaseServiceAccountError, 'FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY_INVALID');
    assert.equal(JSON.stringify(status).includes('not-a-private-key'), false);
  });
});

test('Google authorization URL sends the same redirect URI shown by setup status', () => {
  withEnv({
    GOOGLE_OAUTH_CLIENT_ID: 'client-id',
    GOOGLE_OAUTH_CLIENT_SECRET: 'client-secret',
    GOOGLE_OAUTH_STATE_SECRET: 'state-secret',
    GOOGLE_OAUTH_REDIRECT_URI: undefined,
    FIREBASE_SERVICE_ACCOUNT_JSON: createTestServiceAccountJson(),
    FIREBASE_WEB_API_KEY: undefined,
    FIREBASE_API_KEY: undefined,
    EXPO_PUBLIC_FIREBASE_API_KEY: 'firebase-api-key',
    MONEYKAI_SITE_URL: 'https://moneykai.com',
    PUBLIC_SITE_URL: undefined,
    VERCEL_URL: undefined,
  }, () => {
    const setup = getGoogleOAuthSetupStatus({ requestHostOrigin: 'https://moneykai.com' });
    const result = buildGoogleAuthorizationUrl({
      platform: 'web',
      returnTo: '/dashboard',
      requestOrigin: 'https://moneykai.com',
      requestHostOrigin: 'https://moneykai.com',
    });
    const authorizationUrl = new URL(result.authorizationUrl);

    assert.equal(result.redirectUri, setup.redirectUri);
    assert.equal(authorizationUrl.searchParams.get('redirect_uri'), setup.redirectUri);
  });
});

test('Google OAuth keeps a high-entropy transaction verifier out of the authorization URL', () => {
  withEnv({
    GOOGLE_OAUTH_CLIENT_ID: 'client-id',
    GOOGLE_OAUTH_STATE_SECRET: 'state-secret',
    MONEYKAI_SITE_URL: 'https://moneykai.com',
  }, () => {
    const result = buildGoogleAuthorizationUrl({
      platform: 'web',
      returnTo: '/dashboard',
      requestOrigin: 'https://moneykai.com',
      requestHostOrigin: 'https://moneykai.com',
    });

    assert.match(result.transactionVerifier, /^[A-Za-z0-9_-]{40,}$/);
    assert.equal(result.authorizationUrl.includes(result.transactionVerifier), false);
  });
});

test('Google OAuth exchange rejects a verifier from another client transaction', async () => {
  await withEnvAsync({ GOOGLE_OAUTH_STATE_SECRET: 'state-secret' }, async () => {
    const verifier = 'client-held-verifier-for-the-real-transaction';
    const code = createExchangeCode({
      firebaseUser: { uid: 'firebase-user-1' },
      platform: 'web',
      returnTo: '/dashboard',
      transactionVerifier: verifier,
    });

    await assert.rejects(
      () => consumeExchangeCode(code, 'verifier-from-another-browser-transaction-12345'),
      /does not match the initiating client/i,
    );
    assert.equal((await consumeExchangeCode(code, verifier, {
      consumeJti: async () => undefined,
    })).uid, 'firebase-user-1');
  });
});

test('Google OAuth exchange atomically rejects a second distributed redemption', async () => {
  await withEnvAsync({ GOOGLE_OAUTH_STATE_SECRET: 'state-secret' }, async () => {
    const verifier = 'distributed-exchange-verifier-for-one-client';
    const code = createExchangeCode({
      firebaseUser: { uid: 'firebase-user-2' },
      platform: 'web',
      returnTo: '/dashboard',
      transactionVerifier: verifier,
    });
    const consumed = new Set();
    const redisCall = async (_operation, callback) => ({
      ok: true,
      configured: true,
      value: await callback({
        set: async (key, _value, options) => {
          assert.equal(options.nx, true);
          assert.ok(options.ex > 0);
          if (consumed.has(key)) {
            return null;
          }
          consumed.add(key);
          return 'OK';
        },
      }),
    });

    assert.equal((await consumeExchangeCode(code, verifier, { redisCall })).uid, 'firebase-user-2');
    await assert.rejects(
      () => consumeExchangeCode(code, verifier, { redisCall }),
      /already been used/i,
    );
  });
});

test('Google OAuth exchange fails closed when distributed consumption is unavailable', async () => {
  await withEnvAsync({ GOOGLE_OAUTH_STATE_SECRET: 'state-secret' }, async () => {
    const verifier = 'distributed-store-unavailable-verifier-value';
    const code = createExchangeCode({
      firebaseUser: { uid: 'firebase-user-3' },
      platform: 'mobile',
      returnTo: '/dashboard',
      transactionVerifier: verifier,
    });

    await assert.rejects(
      () => consumeExchangeCode(code, verifier, {
        redisCall: async () => ({ ok: false, configured: false, value: null }),
      }),
      (error) => error?.status === 503 && /temporarily unavailable/i.test(error.message),
    );
  });
});
