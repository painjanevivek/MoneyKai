import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireDist = process.argv.includes('--require-dist');

const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const readFrontendRoute = (relativePath) => {
  const fullPath = path.join(root, relativePath);
  if (fs.existsSync(fullPath)) {
    return { excluded: false, source: readText(relativePath) };
  }

  const ignoreRules = readText('.vercelignore')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  const excludesV1Routes = ignoreRules.includes('api/v1/**');
  const restoresRoute = ignoreRules
    .filter((rule) => rule.startsWith('!') && rule.endsWith('/**'))
    .map((rule) => rule.slice(1, -2))
    .some((prefix) => relativePath.startsWith(prefix));

  if (relativePath.startsWith('api/v1/') && excludesV1Routes && !restoresRoute) {
    return { excluded: true, source: '' };
  }

  return { excluded: false, source: readText(relativePath) };
};
const listFiles = (directory) => {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  };

  walk(directory);
  return files;
};

const results = [];

const check = (label, ok, details) => {
  results.push({ label, ok, details });
};

const getHeaderMap = (relativePath = 'vercel.json', source = '/(.*)') => {
  const vercelConfig = readJson(relativePath);
  const globalHeaderBlock = (vercelConfig.headers ?? []).find((entry) => entry.source === source);
  return new Map((globalHeaderBlock?.headers ?? []).map((header) => [header.key, header.value]));
};

const containsAll = (value, snippets) =>
  typeof value === 'string' && snippets.every((snippet) => value.includes(snippet));

const parseCsp = (policy) => {
  const directives = new Map();
  for (const rawDirective of policy.split(';')) {
    const parts = rawDirective.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 0) {
      directives.set(parts[0].toLowerCase(), parts.slice(1));
    }
  }
  return directives;
};

const cspHashSource = (body) =>
  `'sha256-${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}'`;

const getAttributeValue = (attributes, name) => {
  const match = attributes.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))`, 'i')
  );
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : null;
};

const isCspGovernedInlineScript = (attributes) => {
  if (/\bsrc\s*=/i.test(attributes)) {
    return false;
  }

  const type = (getAttributeValue(attributes, 'type') ?? '').trim().toLowerCase();
  if (!type) {
    return true;
  }

  return (
    type === 'module' ||
    type === 'importmap' ||
    type === 'speculationrules' ||
    type === 'application/javascript' ||
    type === 'application/ecmascript' ||
    type === 'application/x-javascript' ||
    type === 'text/ecmascript' ||
    type.startsWith('text/javascript')
  );
};

const headerMap = getHeaderMap();
const appHeaderMap = getHeaderMap('apps/MoneyKai-web/vercel.json');
const requiredHeaders = [
  'Strict-Transport-Security',
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
  'Origin-Agent-Cluster',
  'X-DNS-Prefetch-Control',
  'X-Permitted-Cross-Domain-Policies',
];

check(
  'OWASP secure response headers',
  requiredHeaders.every((header) => headerMap.has(header)),
  requiredHeaders.filter((header) => !headerMap.has(header)).join(', ') || 'All required headers configured'
);

const csp = headerMap.get('Content-Security-Policy') ?? '';
const appCsp = appHeaderMap.get('Content-Security-Policy') ?? '';
const cspDirectives = parseCsp(csp);
const scriptSources =
  cspDirectives.get('script-src-elem') ??
  cspDirectives.get('script-src') ??
  cspDirectives.get('default-src') ??
  [];
const expoHydrationBody = 'globalThis.__EXPO_ROUTER_HYDRATE__=true;';
const expoHydrationHash = cspHashSource(expoHydrationBody);

check(
  'CSP anti-XSS/clickjacking baseline',
  containsAll(csp, [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ]),
  'CSP should restrict defaults, object embedding, framing, form posts, and insecure subresources'
);

const forbiddenScriptSources = ["'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'", "'strict-dynamic'"];
const presentForbiddenScriptSources = forbiddenScriptSources.filter((source) => scriptSources.includes(source));
check(
  'CSP executable scripts use a narrow Expo hydration hash',
  scriptSources.includes(expoHydrationHash) && presentForbiddenScriptSources.length === 0,
  presentForbiddenScriptSources.length > 0
    ? `Forbidden script sources: ${presentForbiddenScriptSources.join(', ')}`
    : `Expected hydration source ${expoHydrationHash}`
);

check(
  'Root and web-app global CSP stay synchronized',
  csp.length > 0 && csp === appCsp,
  'vercel.json and apps/MoneyKai-web/vercel.json should protect application routes identically'
);

const securityTxtRelativePath = 'apps/MoneyKai-web/public/.well-known/security.txt';
const securityTxtBuffer = fs.readFileSync(path.join(root, securityTxtRelativePath));
const securityTxt = new TextDecoder('utf-8', { fatal: true }).decode(securityTxtBuffer);
const securityTxtFields = new Map();

for (const line of securityTxt.split(/\r?\n/)) {
  if (!line || line.startsWith('#')) {
    continue;
  }
  const separator = line.indexOf(':');
  const name = separator >= 0 ? line.slice(0, separator) : line;
  const value = separator >= 0 ? line.slice(separator + 1).trim() : '';
  const values = securityTxtFields.get(name) ?? [];
  values.push(value);
  securityTxtFields.set(name, values);
}

const contactValues = securityTxtFields.get('Contact') ?? [];
const expiresValues = securityTxtFields.get('Expires') ?? [];
const canonicalValues = securityTxtFields.get('Canonical') ?? [];
const rfc3339Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const expiresAt = expiresValues.length === 1 && rfc3339Pattern.test(expiresValues[0])
  ? Date.parse(expiresValues[0])
  : Number.NaN;
const maxSecurityTxtLifetimeMs = 366 * 24 * 60 * 60 * 1000;
const contactsAreValid = contactValues.length > 0 && contactValues.every((value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'mailto:' || url.protocol === 'https:';
  } catch {
    return false;
  }
});

check(
  'RFC 9116 security contact file',
  !securityTxtBuffer.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])) &&
    !/\r(?!\n)/.test(securityTxt) &&
    /\r?\n$/.test(securityTxt) &&
    contactsAreValid &&
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now() &&
    expiresAt - Date.now() <= maxSecurityTxtLifetimeMs &&
    canonicalValues.length === 1 &&
    canonicalValues[0] === 'https://moneykai.com/.well-known/security.txt',
  'security.txt must be UTF-8 without BOM, end with a newline, include valid Contact URI(s), one future Expires within a year, and the canonical MoneyKai URL'
);

const securityTxtHeaderMaps = [
  getHeaderMap('vercel.json', '/.well-known/security.txt'),
  getHeaderMap('apps/MoneyKai-web/vercel.json', '/.well-known/security.txt'),
];
check(
  'security.txt response metadata',
  securityTxtHeaderMaps.every(
    (headers) =>
      headers.get('Content-Type') === 'text/plain; charset=utf-8' &&
      headers.get('Cache-Control') === 'public, max-age=0, must-revalidate'
  ),
  'Both Vercel project-root configurations must serve fresh UTF-8 plain text'
);

check(
  'Feature policy minimization',
  containsAll(headerMap.get('Permissions-Policy'), [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'bluetooth=()',
  ]),
  'High-risk browser features should stay disabled unless explicitly needed'
);

const apiHttp = readText('api/_lib/http.js');
check(
  'API no-store and hardened JSON responses',
  containsAll(apiHttp, [
    "res.setHeader('Cache-Control', 'no-store')",
    "res.setHeader('Content-Security-Policy', \"default-src 'none'",
    "res.setHeader('X-Frame-Options', 'DENY')",
    "res.setHeader('X-Content-Type-Options', 'nosniff')",
  ]),
  'API helper should prevent caching, framing, MIME sniffing, and active content execution'
);

check(
  'API resource consumption guard',
  containsAll(apiHttp, [
    'DEFAULT_BODY_LIMIT_BYTES',
    'applyRateLimit',
    'Retry-After',
    'Request body is too large.',
  ]),
  'API helper should enforce body limits and rate limiting'
);

check(
  'API browser-origin guard for unsafe methods',
  containsAll(apiHttp, [
    'UNSAFE_METHODS',
    'requireTrustedOrigin',
    'getRequestOrigin',
    'getRequestHostOrigins',
    'isLocalOrigin',
    'MONEYKAI_ALLOWED_APP_ORIGINS',
    'Request origin is not trusted.',
    '!UNSAFE_METHODS.has(method) || requireTrustedOrigin(req, res)',
  ]),
  'State-changing API requests with browser Origin or Referer headers should be restricted to trusted app origins'
);

const highCostRoutes = [
  'api/billing/checkout.js',
  'api/billing/portal.js',
  'api/billing/status.js',
  'api/v1/ai/attachments/analyze.js',
];
const aiAttachmentAnalysis = readFrontendRoute('api/v1/ai/attachments/analyze.js');

for (const route of highCostRoutes) {
  const routeSecurity = route === 'api/v1/ai/attachments/analyze.js'
    ? aiAttachmentAnalysis
    : { excluded: false, source: readText(route) };
  check(
    `Rate limit wired: ${route}`,
    routeSecurity.excluded || routeSecurity.source.includes('applyRateLimit'),
    routeSecurity.excluded
      ? 'AI attachment analysis is excluded from the frontend deploy'
      : 'High-cost or sensitive routes should call applyRateLimit before provider work'
  );
}

const aiAttachmentAnalysisRoute = aiAttachmentAnalysis.source;
const aiRuntime = readText('api/_lib/ai-runtime.js');
check(
  'AI attachment analysis requires Firebase auth',
  aiAttachmentAnalysis.excluded ||
    (containsAll(aiAttachmentAnalysisRoute, [
      'verifyFirebaseIdToken',
      'getBearerToken',
      'await verifyFirebaseIdToken(token)',
    ]) &&
      aiAttachmentAnalysisRoute.indexOf('await verifyFirebaseIdToken(token)') <
        aiAttachmentAnalysisRoute.indexOf('const payload = await readJsonBody')),
  aiAttachmentAnalysis.excluded
    ? 'AI attachment analysis is excluded from the frontend deploy'
    : 'AI attachment analysis must verify the signed-in Firebase user before parsing uploads or calling the AI provider'
);

check(
  'AI inline attachment upload validates image content',
  containsAll(aiRuntime, [
    'ALLOWED_INLINE_IMAGE_TYPES',
    'hasImageMagicBytes',
    "mimeType === 'image/png'",
    "mimeType === 'image/webp'",
    "mimeType === 'image/gif'",
    "mimeType === 'image/jpeg'",
    'Buffer.from(base64, \'base64\')',
    '!hasImageMagicBytes(mimeType, buffer)',
  ]),
  'Inline image analysis should validate MIME allowlist, base64 payload, size, and image magic bytes server-side'
);

const webRootLayout = readText('apps/MoneyKai-web/src/app/_layout.tsx');
const webSentry = readText('apps/MoneyKai-web/src/services/sentry.ts');
const webCookieConsent = readText('apps/MoneyKai-web/src/services/cookieConsent.ts');
const webPrivacyPolicy = readText('apps/MoneyKai-web/src/app/privacy-policy.tsx');
const webContact = readText('apps/MoneyKai-web/src/app/contact.tsx');
const webAnalytics = readText('apps/MoneyKai-web/src/services/analytics.ts');
const webAnalyticsRouteTracker = readText('apps/MoneyKai-web/src/components/analytics/AnalyticsRouteTracker.tsx');
const analyticsEventsRoute = readText('api/analytics/events.js');
const firebaseIdentity = readText('api/_lib/firebase-identity.js');
const googleOAuth = readText('api/_lib/google-oauth.js');
const authEmailSignIn = readFrontendRoute('api/v1/auth/email/sign-in.js');
const authEmailSignUp = readFrontendRoute('api/v1/auth/email/sign-up.js');
const authPasswordReset = readFrontendRoute('api/v1/auth/email/password-reset.js');
const authEmailRoutesExcluded = [authEmailSignIn, authEmailSignUp, authPasswordReset]
  .every((route) => route.excluded);
const authEmailSignInRoute = authEmailSignIn.source;
const authEmailSignUpRoute = authEmailSignUp.source;
const authPasswordResetRoute = authPasswordReset.source;
const authGoogleStartRoute = readText('api/v1/auth/google/start.js');
const authGoogleCallbackRoute = readText('api/v1/auth/google/callback.js');
const authGoogleExchangeRoute = readText('api/v1/auth/google/exchange.js');
const authGoogleSetupStatusRoute = readText('api/v1/auth/google/setup-status.js');
const webAuthStore = readText('apps/MoneyKai-web/src/stores/useAuthStore.ts');
const webAuthGateway = readText('apps/MoneyKai-web/src/services/authGateway.ts');
const webGoogleCallback = readText('apps/MoneyKai-web/src/app/auth/google/callback.tsx');
const webLogin = readText('apps/MoneyKai-web/src/app/(auth)/login.tsx');
const webSignup = readText('apps/MoneyKai-web/src/app/(auth)/signup.tsx');
const webForgotPassword = readText('apps/MoneyKai-web/src/app/(auth)/forgot-password.tsx');
const webSettings = readText('apps/MoneyKai-web/src/app/(tabs)/settings.tsx');
const webAuthRateLimit = readText('apps/MoneyKai-web/src/services/authRateLimit.ts');
const mobileContact = readText('apps/MoneyKai-mobile/src/app/contact.tsx');
const mobileSettings = readText('apps/MoneyKai-mobile/src/app/(tabs)/settings.tsx');
const mobileForgotPassword = readText('apps/MoneyKai-mobile/src/screens/auth/ForgotPasswordScreen.tsx');
const mobileAuthService = readText('apps/MoneyKai-mobile/src/services/authService.ts');
const mobileAuthGateway = readText('apps/MoneyKai-mobile/src/services/authGateway.ts');
const mobileGoogleAuth = readText('apps/MoneyKai-mobile/src/services/googleAuth.ts');
const mobileAuthRateLimit = readText('apps/MoneyKai-mobile/src/services/authRateLimit.ts');
const vercelConfigSource = readText('vercel.json');

check(
  'Web cookie consent banner is mounted globally',
  containsAll(webRootLayout, ['CookieConsentBanner', '<CookieConsentBanner />']),
  'The root web layout should render the cookie consent prompt on every route'
);

check(
  'Web telemetry requires cookie consent',
  containsAll(webSentry, ['hasAnalyticsConsent', '!hasAnalyticsConsent()']) &&
    containsAll(webCookieConsent, ['COOKIE_CONSENT_STORAGE_KEY', "choice: CookieConsentChoice", "value === 'accepted'"]),
  'Sentry telemetry should not initialize or capture events until the visitor accepts optional analytics'
);

check(
  'Privacy policy documents browser storage',
  containsAll(webPrivacyPolicy, ['Cookies and local storage', 'Optional diagnostics and performance telemetry']),
  'The public privacy policy should explain required browser storage and optional telemetry consent'
);

check(
  'Feedback loop exposes support email and bug report path',
  containsAll(webContact, ['SITE.supportEmail', 'Bug report', 'MoneyKai Bug Report', 'mailto:${SITE.supportEmail}']) &&
    containsAll(mobileContact, ['SITE.supportEmail', 'Bug report', 'MoneyKai Bug Report', 'mailto:${SITE.supportEmail}']) &&
    containsAll(webSettings, ['Help & Support', 'Email support or report a bug']) &&
    containsAll(mobileSettings, ['Help & Support', 'Email support or report a bug']),
  'Contact/support surfaces should clearly expose the support email and a dedicated bug report option'
);

check(
  'Web analytics page and event tracking are consent-gated',
  containsAll(webAnalytics, [
    'hasAnalyticsConsent',
    'sanitizeAnalyticsPath',
    'SENSITIVE_KEY_PATTERN',
    'navigator.sendBeacon',
    'keepalive: true',
    'trackPageView',
    'trackUserEvent',
  ]) &&
    containsAll(webAnalyticsRouteTracker, ['usePathname', 'trackPageView(pathname)']) &&
    containsAll(webRootLayout, ['AnalyticsRouteTracker', '<AnalyticsRouteTracker />']) &&
    containsAll(analyticsEventsRoute, [
      'applyRateLimit',
      'readJsonBody(req, { limitBytes: 16 * 1024 })',
      'SENSITIVE_KEY_PATTERN',
      'MAX_EVENTS_PER_REQUEST',
      'sendJson(res, 202',
    ]),
  'Analytics should only run after consent, strip sensitive fields, batch efficiently, and post to a rate-limited endpoint'
);

check(
  'Email/password auth attempts are server-gated and client-throttled',
  containsAll(webAuthRateLimit, ['maxAttempts', 'lockedUntil', 'moneykai:auth-rate-limit:v1']) &&
    containsAll(mobileAuthRateLimit, ['maxAttempts', 'lockedUntil', 'moneykai:auth-rate-limit:v1']) &&
    containsAll(firebaseIdentity, [
      'signInWithPassword',
      'sendOobCode',
      'createCustomToken',
      'FIREBASE_SERVICE_ACCOUNT_JSON',
      'getPublicFirebaseAuthError',
    ]) &&
    (authEmailRoutesExcluded ||
      (containsAll(authEmailSignInRoute, [
        'applyRateLimit(req, res',
        'applyRateLimitForKey',
        'signInWithEmailPassword',
        'sendJson(res, 200',
      ]) &&
        containsAll(authEmailSignUpRoute, [
          'applyRateLimit(req, res',
          'applyRateLimitForKey',
          'createEmailPasswordUser',
          'sendJson(res, 201',
        ]) &&
        containsAll(authPasswordResetRoute, [
          'applyRateLimit(req, res',
          'applyRateLimitForKey',
          'sendPasswordResetEmail',
          'sendJson(res, 202',
        ]))) &&
    containsAll(webAuthGateway, [
      '/v1/auth/email/sign-in',
      '/v1/auth/email/sign-up',
      '/v1/auth/email/password-reset',
      'signInWithCustomToken(firebaseAuth, response.customToken)',
    ]) &&
    containsAll(mobileAuthGateway, [
      '/v1/auth/email/sign-in',
      '/v1/auth/email/sign-up',
      '/v1/auth/email/password-reset',
    ]) &&
    containsAll(webAuthStore, [
      "assertAuthAttemptAllowed('sign-in'",
      "recordFailedAuthAttempt('sign-in'",
      "consumeAuthAttempt('sign-up'",
      'signInWithEmailGateway',
      'createUserWithEmailGateway',
      "consumeAuthAttempt('google-sign-in'",
    ]) &&
    containsAll(webForgotPassword, ["consumeAuthAttempt('password-reset'"]) &&
    containsAll(webSettings, ["consumeAuthAttempt('password-reset'"]) &&
    containsAll(mobileAuthService, [
      "assertAuthAttemptAllowed('sign-in'",
      "recordFailedAuthAttempt('sign-in'",
      "consumeAuthAttempt('sign-up'",
      "consumeAuthAttempt('password-reset'",
      'signInWithCustomToken(gatewayResponse.customToken)',
      'requestPasswordResetGateway',
    ]) &&
    containsAll(mobileGoogleAuth, ["consumeAuthAttempt('google-sign-in'"]) &&
    !webAuthStore.includes('signInWithEmailAndPassword') &&
    !webAuthStore.includes('createUserWithEmailAndPassword') &&
    !mobileAuthService.includes('signInWithEmailAndPassword') &&
    !mobileAuthService.includes('createUserWithEmailAndPassword'),
  authEmailRoutesExcluded
    ? 'Email auth routes are excluded from the frontend deploy; clients remain backend-gated and throttled'
    : 'Email/password and reset attempts should pass through rate-limited backend auth routes before Firebase session creation'
);

check(
  'Google OAuth is backend-owned and custom-token based',
  containsAll(googleOAuth, [
    'GOOGLE_AUTH_URL',
    'GOOGLE_TOKEN_URL',
    'GOOGLE_JWKS_URL',
    'GOOGLE_OAUTH_CLIENT_SECRET',
      'GOOGLE_OAUTH_STATE_SECRET',
      'getGoogleOAuthSetupStatus',
      'requiredGoogleCloud',
      'firebaseServiceAccountValidShape',
      'firebaseApiKeyConfigured',
      'code_challenge',
      'verifyGoogleIdToken',
      'email_verified',
    'signInWithGoogleIdToken',
    'consumeExchangeCode',
    'moneykai-mobile://auth/google',
  ]) &&
    containsAll(firebaseIdentity, [
      'signInWithIdp',
      'providerId: \'google.com\'',
      'mintFirebaseCustomToken',
    ]) &&
    containsAll(authGoogleStartRoute, [
      'applyRateLimit(req, res',
      'buildGoogleAuthorizationUrl',
      'sendJson(res, 200',
    ]) &&
    containsAll(authGoogleSetupStatusRoute, [
      'requireMethod(req, res, \'GET\')',
      'applyRateLimit(req, res',
      'getGoogleOAuthSetupStatus',
      'sendJson(res, 200',
    ]) &&
    containsAll(authGoogleCallbackRoute, [
      'requireMethod(req, res, \'GET\')',
      'completeGoogleOAuthCallback',
      'Location',
      'Cache-Control',
    ]) &&
    containsAll(authGoogleExchangeRoute, [
      'applyRateLimit(req, res',
      'applyRateLimitForKey',
      'consumeExchangeCode',
      'mintFirebaseCustomToken',
      'sendJson(res, 200',
    ]) &&
    containsAll(webAuthGateway, [
      '/v1/auth/google/start',
      '/v1/auth/google/exchange',
      'startGoogleOAuthGateway',
      'exchangeGoogleOAuthCodeGateway',
      'signInWithCustomToken(firebaseAuth, response.customToken)',
    ]) &&
    containsAll(webAuthStore, [
      'startGoogleOAuthGateway',
      'window.location.assign(authorizationUrl)',
    ]) &&
    containsAll(webGoogleCallback, [
      'exchangeGoogleOAuthCodeGateway',
      "trackUserEvent('auth_login_succeeded'",
      "auth_provider: 'google'",
    ]) &&
    containsAll(mobileAuthGateway, [
      '/v1/auth/google/start',
      '/v1/auth/google/exchange',
      'startGoogleOAuthGateway',
      'exchangeGoogleOAuthCodeGateway',
    ]) &&
    containsAll(mobileGoogleAuth, [
      'startGoogleOAuthGateway',
      'moneykai-mobile://auth/google',
      'signInWithGoogleOAuthCode',
      "consumeAuthAttempt('google-sign-in'",
    ]) &&
    !webAuthStore.includes('signInWithPopup') &&
    !webAuthStore.includes('GoogleAuthProvider') &&
    !mobileGoogleAuth.includes('GoogleAuthProvider.credential') &&
    !mobileGoogleAuth.includes('signInWithCredential'),
  'Google sign-in should start on the backend, verify Google identity server-side, and complete through Firebase custom tokens'
);

check(
  'Password reset flow is wired and enumeration-safe',
  containsAll(vercelConfigSource, [
    '"source": "/__/auth"',
    '"source": "/__/auth/:path*"',
    '"source": "/__/firebase/init.json"',
    'firebaseapp.com/__/auth',
  ]) &&
    containsAll(webForgotPassword, [
      'requestPasswordResetGateway(normalizedEmail)',
      'setSentEmail(normalizedEmail)',
      'isPasswordResetEnumerationError',
      'If a MoneyKai account can receive resets',
    ]) &&
    containsAll(mobileForgotPassword, [
      'requestPasswordResetEmail(normalizedEmail)',
      'setSentEmail(normalizedEmail)',
      'isPasswordResetEnumerationError',
      'If a MoneyKai account can receive resets',
    ]) &&
    containsAll(webSettings, ['requestPasswordResetGateway(normalizedEmail)']) &&
    containsAll(mobileAuthService, ['requestPasswordResetGateway(normalizedEmail)']),
  'Reset links should route through the backend auth gateway, normalize email input, throttle attempts, and avoid account enumeration'
);

check(
  'Core web auth user events are tracked',
  containsAll(webLogin, [
    "trackUserEvent('auth_login_submitted'",
    "trackUserEvent('auth_login_succeeded'",
    "trackUserEvent('auth_login_failed'",
  ]) &&
    containsAll(webSignup, [
      "trackUserEvent('auth_signup_submitted'",
      "trackUserEvent('auth_signup_succeeded'",
      "trackUserEvent('auth_signup_failed'",
    ]) &&
    containsAll(webForgotPassword, [
      "trackUserEvent('auth_password_reset_submitted'",
      "trackUserEvent('auth_password_reset_succeeded'",
      "trackUserEvent('auth_password_reset_failed'",
    ]) &&
    containsAll(webSettings, [
      "trackUserEvent('auth_password_reset_submitted'",
      "trackUserEvent('auth_password_reset_succeeded'",
      "trackUserEvent('auth_password_reset_failed'",
    ]),
  'High-signal auth events should emit through the sanitized analytics helper'
);

const clientRuntimeFiles = [
  'apps/MoneyKai-web/src/config/environment.ts',
  'apps/MoneyKai-mobile/src/config/environment.ts',
];
const serverSecretPatterns = [
  'process.env.STRIPE_SECRET_KEY',
  'process.env.STRIPE_RESTRICTED_KEY',
  'process.env.STRIPE_WEBHOOK_SECRET',
  'process.env.OPENROUTER_API_KEY',
  'process.env.MONEYKAI_OPENROUTER_API_KEY',
  'process.env.SENTRY_AUTH_TOKEN',
  'process.env.FIREBASE_SERVICE_ACCOUNT_JSON',
  'process.env.GOOGLE_CLIENT_SECRET',
  'process.env.KITE_API_SECRET',
];

for (const file of clientRuntimeFiles) {
  const source = readText(file);
  check(
    `No server secrets in client runtime: ${file}`,
    !serverSecretPatterns.some((pattern) => source.includes(pattern)),
    'Client bundles must read only public EXPO_PUBLIC_* configuration'
  );
}

const trackedFiles = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);
const trackedEnvFiles = trackedFiles.filter((file) => /(^|\/)\.env($|\.)/.test(file) && !file.endsWith('.env.example'));

check(
  'No real env files tracked',
  trackedEnvFiles.length === 0,
  trackedEnvFiles.join(', ') || 'Only env templates are tracked'
);

const webDistDir = path.join(root, 'apps', 'MoneyKai-web', 'dist');
const webDistFiles = listFiles(webDistDir);
const webDistExists = fs.existsSync(webDistDir);
const publicSourceMaps = webDistFiles.filter((file) => file.endsWith('.map'));
const jsFilesWithSourceMapRefs = webDistFiles.filter(
  (file) => file.endsWith('.js') && fs.readFileSync(file, 'utf8').includes('sourceMappingURL=')
);

check(
  'Required production web export is present',
  !requireDist || webDistExists,
  '--require-dist must only pass after Expo has emitted apps/MoneyKai-web/dist'
);

const distSecurityTxtPath = path.join(webDistDir, '.well-known', 'security.txt');
check(
  'security.txt is copied into the web export',
  !webDistExists ||
    (fs.existsSync(distSecurityTxtPath) &&
      fs.readFileSync(distSecurityTxtPath).equals(securityTxtBuffer)),
  'Expo must copy public/.well-known/security.txt byte-for-byte into dist'
);

const exportedHtmlFiles = webDistFiles.filter((file) => file.endsWith('.html'));
const unauthorizedInlineScripts = [];
const dangerousInlineMarkup = [];

for (const htmlFile of exportedHtmlFiles) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const scriptPattern = /<script\b(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const attributes = match.groups?.attributes ?? '';
    if (!isCspGovernedInlineScript(attributes)) {
      continue;
    }
    const body = match.groups?.body ?? '';
    const hash = cspHashSource(body);
    if (!scriptSources.includes(hash)) {
      unauthorizedInlineScripts.push(`${path.relative(root, htmlFile)} (${hash})`);
    }
  }

  if (
    /\son[a-z0-9_-]+\s*=/i.test(html) ||
    /\b(?:href|src|action)\s*=\s*(?:"\s*javascript:|'\s*javascript:)/i.test(html)
  ) {
    dangerousInlineMarkup.push(path.relative(root, htmlFile));
  }
}

check(
  'Exported executable inline scripts are CSP-authorized',
  !webDistExists ||
    (exportedHtmlFiles.length > 0 &&
      unauthorizedInlineScripts.length === 0 &&
      dangerousInlineMarkup.length === 0),
  unauthorizedInlineScripts.concat(dangerousInlineMarkup).slice(0, 10).join(', ') ||
    'Every executable inline script must match a configured hash and inline handlers/JavaScript URLs are forbidden'
);

check(
  'No public web source maps',
  publicSourceMaps.length === 0 && jsFilesWithSourceMapRefs.length === 0,
  webDistFiles.length === 0
    ? 'No local web export found to inspect'
    : publicSourceMaps.concat(jsFilesWithSourceMapRefs).map((file) => path.relative(root, file)).slice(0, 10).join(', ') ||
        'No .map files or sourceMappingURL comments found in web export'
);

for (const result of results) {
  const state = result.ok ? 'PASS' : 'FAIL';
  console.log(`[${state}] ${result.label} - ${result.details}`);
}

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  console.error(`\nOWASP security check failed: ${failed.length} issue(s).`);
  process.exit(1);
}

console.log('\nOWASP security check passed.');
