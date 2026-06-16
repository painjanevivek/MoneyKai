const crypto = require('node:crypto');

const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let cachedCerts = null;
let cachedCertsExpiresAt = 0;

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
};

const parseJwt = (token) => {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('Invalid Firebase ID token.');
  }

  return {
    encodedHeader,
    encodedPayload,
    encodedSignature,
    header: JSON.parse(base64UrlDecode(encodedHeader).toString('utf8')),
    payload: JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')),
    signature: base64UrlDecode(encodedSignature),
  };
};

const getProjectId = () =>
  process.env.FIREBASE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  '';

const getFirebaseCerts = async () => {
  const now = Date.now();
  if (cachedCerts && cachedCertsExpiresAt > now) {
    return cachedCerts;
  }

  const response = await fetch(CERTS_URL);
  if (!response.ok) {
    throw new Error('Unable to fetch Firebase token certificates.');
  }

  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;

  cachedCerts = await response.json();
  cachedCertsExpiresAt = now + Math.max(60, maxAgeSeconds - 60) * 1000;
  return cachedCerts;
};

const verifyFirebaseIdToken = async (token) => {
  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is required for billing authentication.');
  }

  const parsed = parseJwt(token);
  if (parsed.header.alg !== 'RS256' || !parsed.header.kid) {
    throw new Error('Invalid Firebase ID token header.');
  }

  const certs = await getFirebaseCerts();
  const cert = certs[parsed.header.kid];
  if (!cert) {
    throw new Error('Firebase signing certificate was not found.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${parsed.encodedHeader}.${parsed.encodedPayload}`);
  verifier.end();

  if (!verifier.verify(cert, parsed.signature)) {
    throw new Error('Invalid Firebase ID token signature.');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  if (parsed.payload.aud !== projectId || parsed.payload.iss !== expectedIssuer) {
    throw new Error('Firebase ID token is for a different project.');
  }

  if (!parsed.payload.sub || typeof parsed.payload.sub !== 'string') {
    throw new Error('Firebase ID token is missing a subject.');
  }

  if (parsed.payload.exp <= nowSeconds || parsed.payload.iat > nowSeconds + 300) {
    throw new Error('Firebase ID token is expired or not yet valid.');
  }

  return {
    uid: parsed.payload.sub,
    email: parsed.payload.email || '',
    name: parsed.payload.name || parsed.payload.email || '',
  };
};

module.exports = { verifyFirebaseIdToken };
