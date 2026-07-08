const assert = require('node:assert/strict');
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
    MONEYKAI_SITE_URL: 'https://moneykai.com',
    PUBLIC_SITE_URL: undefined,
    VERCEL_URL: undefined,
  }, () => {
    const status = getGoogleOAuthSetupStatus({ requestHostOrigin: 'https://moneykai.com' });

    assert.equal(status.configured, true);
    assert.equal(status.clientIdConfigured, true);
    assert.equal(status.clientSecretConfigured, true);
    assert.equal(status.stateSecretConfigured, true);
    assert.equal(status.redirectUri, 'https://moneykai.com/api/v1/auth/google/callback');
    assert.deepEqual(status.requiredGoogleCloud.authorizedRedirectUris, [
      'https://moneykai.com/api/v1/auth/google/callback',
    ]);
    assert.equal(JSON.stringify(status).includes('client-secret'), false);
    assert.equal(JSON.stringify(status).includes('state-secret'), false);
  });
});

test('Google authorization URL sends the same redirect URI shown by setup status', () => {
  withEnv({
    GOOGLE_OAUTH_CLIENT_ID: 'client-id',
    GOOGLE_OAUTH_CLIENT_SECRET: 'client-secret',
    GOOGLE_OAUTH_STATE_SECRET: 'state-secret',
    GOOGLE_OAUTH_REDIRECT_URI: undefined,
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
