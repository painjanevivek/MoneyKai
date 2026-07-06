const crypto = require('node:crypto');
const { getAppUrl } = require('./http');
const {
  FirebaseIdentityError,
  signInWithGoogleIdToken,
} = require('./firebase-identity');

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);
const STATE_TTL_MS = 10 * 60 * 1000;
const EXCHANGE_CODE_TTL_MS = 5 * 60 * 1000;
const MAX_RETURN_PATH_LENGTH = 240;
const MOBILE_REDIRECT_URI = 'moneykai-mobile://auth/google';
const DEFAULT_TRUSTED_WEB_APP_HOSTS = new Set([
  'moneykai.com',
  'www.moneykai.com',
  'smartpaisa.vercel.app',
  'moneykai-web-vivek-painjanes-projects.vercel.app',
  'moneykai-web-git-main-vivek-painjanes-projects.vercel.app',
]);

let jwksCache = {
  expiresAt: 0,
  keys: new Map(),
};

const consumedExchangeCodes = new Map();

class GoogleOAuthError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'GoogleOAuthError';
    this.code = options.code || 'GOOGLE_OAUTH_ERROR';
    this.status = options.status || 400;
  }
}

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const base64UrlDecode = (value) => {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${normalized}${'='.repeat((4 - (normalized.length % 4)) % 4)}`;
  return Buffer.from(padded, 'base64');
};

const randomToken = (bytes = 32) => base64UrlEncode(crypto.randomBytes(bytes));

const sha256Base64Url = (value) => base64UrlEncode(crypto.createHash('sha256').update(value).digest());

const getGoogleClientId = () => {
  const value = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  if (!value.trim()) {
    throw new GoogleOAuthError('Google OAuth client id is not configured.', {
      code: 'GOOGLE_CLIENT_ID_MISSING',
      status: 503,
    });
  }
  return value.trim();
};

const getGoogleClientSecret = () => {
  const value = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
  if (!value.trim()) {
    throw new GoogleOAuthError('Google OAuth client secret is not configured.', {
      code: 'GOOGLE_CLIENT_SECRET_MISSING',
      status: 503,
    });
  }
  return value.trim();
};

const getOAuthSigningSecret = () => {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';
  const value =
    process.env.GOOGLE_OAUTH_STATE_SECRET ||
    process.env.AUTH_STATE_SECRET ||
    process.env.FIREBASE_PRIVATE_KEY ||
    serviceAccountJson ||
    '';

  if (!value.trim()) {
    throw new GoogleOAuthError('Google OAuth state signing secret is not configured.', {
      code: 'GOOGLE_STATE_SECRET_MISSING',
      status: 503,
    });
  }

  return value.trim();
};

const getBackendGoogleRedirectUri = (candidateOrigin) => {
  const configured = process.env.GOOGLE_OAUTH_REDIRECT_URI || '';
  if (configured.trim()) {
    return configured.trim();
  }

  if (candidateOrigin && isTrustedWebAppUrl(candidateOrigin)) {
    return `${normalizeWebAppUrl(candidateOrigin)}/api/v1/auth/google/callback`;
  }

  return `${getAppUrl().replace(/\/$/, '')}/api/v1/auth/google/callback`;
};

const isLocalWebAppUrl = (value) => {
  try {
    const parsed = new URL(value);
    return (
      process.env.NODE_ENV !== 'production' &&
      ['http:', 'https:'].includes(parsed.protocol) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
    );
  } catch {
    return false;
  }
};

const normalizeWebAppUrl = (value) => {
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new GoogleOAuthError('Application callback URL must use HTTP or HTTPS.', {
      code: 'GOOGLE_APP_URL_INVALID',
      status: 400,
    });
  }

  if (parsed.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) {
    throw new GoogleOAuthError('Application callback URL must use HTTPS outside local development.', {
      code: 'GOOGLE_APP_URL_INSECURE',
      status: 400,
    });
  }

  parsed.username = '';
  parsed.password = '';
  parsed.hash = '';
  parsed.search = '';
  parsed.pathname = parsed.pathname.replace(/\/$/, '');
  return parsed.toString().replace(/\/$/, '');
};

const getTrustedWebAppHosts = () => {
  const hosts = new Set(DEFAULT_TRUSTED_WEB_APP_HOSTS);
  const addHost = (value) => {
    const raw = String(value || '').trim();
    if (!raw) {
      return;
    }

    try {
      hosts.add(new URL(raw).hostname.toLowerCase());
    } catch {
      hosts.add(raw.toLowerCase());
    }
  };

  for (const value of [
    process.env.MONEYKAI_SITE_URL,
    process.env.PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.MONEYKAI_ALLOWED_APP_HOSTS,
    process.env.MONEYKAI_ALLOWED_APP_ORIGINS,
  ]) {
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach(addHost);
  }

  return hosts;
};

const isTrustedWebAppUrl = (value) => {
  if (isLocalWebAppUrl(value)) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && getTrustedWebAppHosts().has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
};

const resolveWebAppUrl = (candidate) => {
  if (candidate && isTrustedWebAppUrl(candidate)) {
    return normalizeWebAppUrl(candidate);
  }

  return getAppUrl();
};

const signPayload = (payload) =>
  crypto.createHmac('sha256', getOAuthSigningSecret()).update(payload).digest('base64url');

const encodeSignedPayload = (payload) => {
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${signPayload(body)}`;
};

const decodeSignedPayload = (token, expectedType) => {
  try {
    const [body, signature] = String(token || '').split('.');
    if (!body || !signature) {
      throw new Error('Malformed token');
    }

    const expected = signPayload(body);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(base64UrlDecode(body).toString('utf8'));
    if (payload.type !== expectedType) {
      throw new Error('Invalid token type');
    }

    if (!payload.exp || Date.now() > payload.exp) {
      throw new GoogleOAuthError('OAuth token has expired.', {
        code: 'OAUTH_TOKEN_EXPIRED',
        status: 400,
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof GoogleOAuthError) {
      throw error;
    }

    throw new GoogleOAuthError('OAuth state is malformed.', {
      code: 'OAUTH_TOKEN_MALFORMED',
      status: 400,
    });
  }
};

const sanitizeReturnPath = (value) => {
  const fallback = '/dashboard';
  const raw = String(value || '').trim();
  if (!raw) {
    return fallback;
  }

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  if (
    decoded.length > MAX_RETURN_PATH_LENGTH ||
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.includes('\\') ||
    /[\u0000-\u001F]/.test(decoded)
  ) {
    return fallback;
  }

  return decoded;
};

const getWebCallbackUrl = (code, returnPath, appUrl) => {
  const url = new URL('/auth/google/callback', appUrl || getAppUrl());
  url.searchParams.set('code', code);
  url.searchParams.set('returnTo', sanitizeReturnPath(returnPath));
  return url.toString();
};

const getMobileCallbackUrl = (code, returnPath) => {
  const url = new URL(MOBILE_REDIRECT_URI);
  url.searchParams.set('code', code);
  url.searchParams.set('returnTo', sanitizeReturnPath(returnPath));
  return url.toString();
};

const normalizePlatform = (value) => (value === 'mobile' ? 'mobile' : 'web');

const buildGoogleAuthorizationUrl = ({ platform, returnTo, requestOrigin, requestHostOrigin }) => {
  const normalizedPlatform = normalizePlatform(platform);
  const codeVerifier = randomToken(48);
  const redirectUri = getBackendGoogleRedirectUri(requestHostOrigin);
  const appUrl = resolveWebAppUrl(requestOrigin);
  const state = encodeSignedPayload({
    type: 'google_oauth_state',
    platform: normalizedPlatform,
    returnTo: sanitizeReturnPath(returnTo),
    codeVerifier,
    redirectUri,
    appUrl,
    nonce: randomToken(16),
    iat: Date.now(),
    exp: Date.now() + STATE_TTL_MS,
  });

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set('client_id', getGoogleClientId());
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', sha256Base64Url(codeVerifier));
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('include_granted_scopes', 'true');

  return {
    authorizationUrl: url.toString(),
  };
};

const exchangeAuthorizationCode = async ({ code, codeVerifier, redirectUri }) => {
  const body = new URLSearchParams({
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: redirectUri || getBackendGoogleRedirectUri(),
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.id_token) {
    throw new GoogleOAuthError('Google did not return a usable identity token.', {
      code: payload.error || 'GOOGLE_TOKEN_EXCHANGE_FAILED',
      status: response.status >= 500 ? 502 : 401,
    });
  }

  return payload;
};

const parseJwt = (token) => {
  const [encodedHeader, encodedPayload, encodedSignature] = String(token || '').split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new GoogleOAuthError('Google identity token is malformed.', {
      code: 'GOOGLE_ID_TOKEN_MALFORMED',
      status: 401,
    });
  }

  return {
    encodedHeader,
    encodedPayload,
    encodedSignature,
    header: JSON.parse(base64UrlDecode(encodedHeader).toString('utf8')),
    payload: JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')),
  };
};

const getGoogleJwks = async () => {
  const now = Date.now();
  if (jwksCache.expiresAt > now && jwksCache.keys.size > 0) {
    return jwksCache.keys;
  }

  const response = await fetch(GOOGLE_JWKS_URL, {
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(payload.keys)) {
    throw new GoogleOAuthError('Google signing keys are unavailable.', {
      code: 'GOOGLE_JWKS_UNAVAILABLE',
      status: 502,
    });
  }

  const maxAgeMatch = String(response.headers.get('cache-control') || '').match(/max-age=(\d+)/i);
  const maxAgeMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 60 * 60 * 1000;
  const keys = new Map();
  for (const key of payload.keys) {
    if (key.kid) {
      keys.set(key.kid, key);
    }
  }

  jwksCache = {
    expiresAt: now + Math.min(maxAgeMs, 6 * 60 * 60 * 1000),
    keys,
  };
  return keys;
};

const verifyGoogleIdToken = async (idToken) => {
  const parsed = parseJwt(idToken);
  if (parsed.header.alg !== 'RS256' || !parsed.header.kid) {
    throw new GoogleOAuthError('Google identity token algorithm is not trusted.', {
      code: 'GOOGLE_ID_TOKEN_ALG_INVALID',
      status: 401,
    });
  }

  const keys = await getGoogleJwks();
  const jwk = keys.get(parsed.header.kid);
  if (!jwk) {
    throw new GoogleOAuthError('Google identity token key is not trusted.', {
      code: 'GOOGLE_ID_TOKEN_KID_INVALID',
      status: 401,
    });
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${parsed.encodedHeader}.${parsed.encodedPayload}`);
  verifier.end();
  const valid = verifier.verify(crypto.createPublicKey({ key: jwk, format: 'jwk' }), base64UrlDecode(parsed.encodedSignature));
  if (!valid) {
    throw new GoogleOAuthError('Google identity token signature is invalid.', {
      code: 'GOOGLE_ID_TOKEN_SIGNATURE_INVALID',
      status: 401,
    });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (!GOOGLE_ISSUERS.has(parsed.payload.iss) || parsed.payload.aud !== getGoogleClientId() || Number(parsed.payload.exp || 0) <= nowSeconds) {
    throw new GoogleOAuthError('Google identity token claims are invalid.', {
      code: 'GOOGLE_ID_TOKEN_CLAIMS_INVALID',
      status: 401,
    });
  }

  if (!parsed.payload.email || parsed.payload.email_verified !== true) {
    throw new GoogleOAuthError('Google account email must be verified.', {
      code: 'GOOGLE_EMAIL_NOT_VERIFIED',
      status: 403,
    });
  }

  return parsed.payload;
};

const createExchangeCode = ({ firebaseUser, platform, returnTo }) =>
  encodeSignedPayload({
    type: 'google_oauth_exchange',
    jti: randomToken(18),
    platform: normalizePlatform(platform),
    returnTo: sanitizeReturnPath(returnTo),
    uid: firebaseUser.uid,
    iat: Date.now(),
    exp: Date.now() + EXCHANGE_CODE_TTL_MS,
  });

const consumeExchangeCode = (code) => {
  const payload = decodeSignedPayload(code, 'google_oauth_exchange');
  const jti = payload.jti;
  const now = Date.now();

  for (const [key, expiresAt] of consumedExchangeCodes.entries()) {
    if (expiresAt <= now) {
      consumedExchangeCodes.delete(key);
    }
  }

  if (jti && consumedExchangeCodes.has(jti)) {
    throw new GoogleOAuthError('Google sign-in code has already been used.', {
      code: 'GOOGLE_EXCHANGE_CODE_REPLAYED',
      status: 409,
    });
  }

  if (jti) {
    consumedExchangeCodes.set(jti, payload.exp);
  }

  return payload;
};

const completeGoogleOAuthCallback = async ({ code, state }) => {
  if (!code || typeof code !== 'string') {
    throw new GoogleOAuthError('Google authorization code is missing.', {
      code: 'GOOGLE_AUTH_CODE_MISSING',
      status: 400,
    });
  }

  const statePayload = decodeSignedPayload(state, 'google_oauth_state');
  const tokenPayload = await exchangeAuthorizationCode({
    code,
    codeVerifier: statePayload.codeVerifier,
    redirectUri: statePayload.redirectUri,
  });
  const googleProfile = await verifyGoogleIdToken(tokenPayload.id_token);
  const firebaseUser = await signInWithGoogleIdToken({
    idToken: tokenPayload.id_token,
    email: googleProfile.email,
    displayName: googleProfile.name,
    photoUrl: googleProfile.picture,
  });
  const exchangeCode = createExchangeCode({
    firebaseUser,
    platform: statePayload.platform,
    returnTo: statePayload.returnTo,
  });

  return statePayload.platform === 'mobile'
    ? getMobileCallbackUrl(exchangeCode, statePayload.returnTo)
    : getWebCallbackUrl(exchangeCode, statePayload.returnTo, statePayload.appUrl);
};

const getPublicGoogleOAuthError = (error) => {
  if (error instanceof GoogleOAuthError || error instanceof FirebaseIdentityError) {
    return {
      status: error.status >= 500 ? error.status : error.status || 400,
      message: error.status >= 500 ? 'Google sign-in is not configured.' : error.message,
    };
  }

  return {
    status: 500,
    message: 'Google sign-in failed.',
  };
};

module.exports = {
  GoogleOAuthError,
  buildGoogleAuthorizationUrl,
  completeGoogleOAuthCallback,
  consumeExchangeCode,
  getPublicGoogleOAuthError,
  getWebCallbackUrl,
  sanitizeReturnPath,
};
