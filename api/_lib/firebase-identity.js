const crypto = require('node:crypto');

const IDENTITY_TOOLKIT_BASE_URL = 'https://identitytoolkit.googleapis.com/v1';
const CUSTOM_TOKEN_AUDIENCE = 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';
const MIN_PASSWORD_LENGTH = 8;
const MAX_EMAIL_LENGTH = 254;
const MAX_DISPLAY_NAME_LENGTH = 80;

class FirebaseIdentityError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'FirebaseIdentityError';
    this.code = options.code || 'FIREBASE_IDENTITY_ERROR';
    this.status = options.status || 400;
  }
}

const base64Url = (value) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const normalizeDisplayName = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_DISPLAY_NAME_LENGTH);

const assertValidEmail = (email) => {
  if (!email || email.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new FirebaseIdentityError('Enter a valid email address.', {
      code: 'INVALID_EMAIL',
      status: 400,
    });
  }
};

const assertValidPassword = (password) => {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > 128) {
    throw new FirebaseIdentityError('Password must be between 8 and 128 characters.', {
      code: 'INVALID_PASSWORD',
      status: 400,
    });
  }
};

const assertValidDisplayName = (displayName) => {
  if (!displayName || displayName.length < 2) {
    throw new FirebaseIdentityError('Full name must be at least 2 characters.', {
      code: 'INVALID_DISPLAY_NAME',
      status: 400,
    });
  }
};

const getFirebaseApiKey = () => {
  const value =
    process.env.FIREBASE_WEB_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    '';

  if (!value.trim()) {
    throw new FirebaseIdentityError('Firebase web API key is not configured.', {
      code: 'FIREBASE_API_KEY_MISSING',
      status: 503,
    });
  }

  return value.trim();
};

const parseServiceAccountJson = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new FirebaseIdentityError('Firebase service account JSON is invalid.', {
      code: 'FIREBASE_SERVICE_ACCOUNT_INVALID',
      status: 503,
    });
  }
};

const getServiceAccount = () => {
  const parsed = parseServiceAccountJson();
  const clientEmail =
    parsed?.client_email ||
    process.env.FIREBASE_CLIENT_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL ||
    '';
  const privateKey =
    parsed?.private_key ||
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.GOOGLE_PRIVATE_KEY ||
    '';

  if (!clientEmail.trim() || !privateKey.trim()) {
    throw new FirebaseIdentityError('Firebase service account credentials are not configured.', {
      code: 'FIREBASE_SERVICE_ACCOUNT_MISSING',
      status: 503,
    });
  }

  return {
    clientEmail: clientEmail.trim(),
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
};

const hashIdentifier = (value) =>
  crypto.createHash('sha256').update(String(value || '').toLowerCase()).digest('hex').slice(0, 32);

const firebaseRequest = async (method, payload) => {
  const apiKey = getFirebaseApiKey();
  const response = await fetch(`${IDENTITY_TOOLKIT_BASE_URL}/accounts:${method}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const providerCode = data?.error?.message || 'FIREBASE_REQUEST_FAILED';
    throw new FirebaseIdentityError('Firebase authentication request failed.', {
      code: providerCode,
      status: response.status,
    });
  }

  return data;
};

const createCustomToken = (uid, claims = {}) => {
  if (!uid || typeof uid !== 'string' || uid.length > 128) {
    throw new FirebaseIdentityError('Firebase user id cannot be used for custom token minting.', {
      code: 'INVALID_UID',
      status: 500,
    });
  }

  const serviceAccount = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  const payload = {
    iss: serviceAccount.clientEmail,
    sub: serviceAccount.clientEmail,
    aud: CUSTOM_TOKEN_AUDIENCE,
    iat: now,
    exp: now + 55 * 60,
    uid,
    claims,
  };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = crypto.createSign('RSA-SHA256').update(signingInput).sign(serviceAccount.privateKey);

  return `${signingInput}.${base64Url(signature)}`;
};

const mintFirebaseCustomToken = (uid, claims = {}) => createCustomToken(uid, claims);

const signInWithEmailPassword = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  assertValidEmail(normalizedEmail);
  assertValidPassword(password);

  const result = await firebaseRequest('signInWithPassword', {
    email: normalizedEmail,
    password,
    returnSecureToken: true,
  });

  return {
    customToken: createCustomToken(result.localId),
    uid: result.localId,
    email: result.email || normalizedEmail,
    displayName: result.displayName || '',
  };
};

const createEmailPasswordUser = async ({ email, password, displayName }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedDisplayName = normalizeDisplayName(displayName);
  assertValidEmail(normalizedEmail);
  assertValidPassword(password);
  assertValidDisplayName(normalizedDisplayName);

  const signUpResult = await firebaseRequest('signUp', {
    email: normalizedEmail,
    password,
    returnSecureToken: true,
  });

  const updateResult = await firebaseRequest('update', {
    idToken: signUpResult.idToken,
    displayName: normalizedDisplayName,
    returnSecureToken: true,
  });

  return {
    customToken: createCustomToken(signUpResult.localId),
    uid: signUpResult.localId,
    email: updateResult.email || signUpResult.email || normalizedEmail,
    displayName: updateResult.displayName || normalizedDisplayName,
  };
};

const sendPasswordResetEmail = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  assertValidEmail(normalizedEmail);

  try {
    await firebaseRequest('sendOobCode', {
      requestType: 'PASSWORD_RESET',
      email: normalizedEmail,
    });
  } catch (error) {
    if (error instanceof FirebaseIdentityError && /EMAIL_NOT_FOUND|USER_NOT_FOUND/i.test(error.code)) {
      return { accepted: true };
    }

    throw error;
  }

  return { accepted: true };
};

const signInWithGoogleIdToken = async ({ idToken, email, displayName, photoUrl }) => {
  if (!idToken || typeof idToken !== 'string') {
    throw new FirebaseIdentityError('Google identity token is required.', {
      code: 'GOOGLE_ID_TOKEN_MISSING',
      status: 400,
    });
  }

  const result = await firebaseRequest('signInWithIdp', {
    postBody: new URLSearchParams({
      id_token: idToken,
      providerId: 'google.com',
    }).toString(),
    requestUri: 'https://moneykai.com/auth/google/callback',
    returnIdpCredential: false,
    returnSecureToken: true,
  });

  return {
    uid: result.localId,
    email: result.email || normalizeEmail(email),
    displayName: result.displayName || displayName || result.email || '',
    photoUrl: result.photoUrl || photoUrl || '',
  };
};

const getPublicFirebaseAuthError = (error, fallback = 'Authentication request failed.') => {
  const code = error instanceof FirebaseIdentityError ? error.code : '';

  if (/EMAIL_EXISTS/i.test(code)) {
    return { status: 409, message: 'An account already exists for this email.' };
  }

  if (/INVALID_PASSWORD|EMAIL_NOT_FOUND|INVALID_LOGIN_CREDENTIALS|USER_DISABLED/i.test(code)) {
    return { status: 401, message: 'The email or password does not match a MoneyKai account.' };
  }

  if (/WEAK_PASSWORD/i.test(code)) {
    return { status: 400, message: 'Use a stronger password with at least 8 characters.' };
  }

  if (error instanceof FirebaseIdentityError) {
    return { status: error.status, message: error.status >= 500 ? 'Authentication service is not configured.' : error.message };
  }

  return { status: 500, message: fallback };
};

module.exports = {
  FirebaseIdentityError,
  createEmailPasswordUser,
  getPublicFirebaseAuthError,
  hashIdentifier,
  mintFirebaseCustomToken,
  normalizeEmail,
  sendPasswordResetEmail,
  signInWithGoogleIdToken,
  signInWithEmailPassword,
};
