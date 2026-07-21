const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const {
  buildGoogleAuthorizationUrl,
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
