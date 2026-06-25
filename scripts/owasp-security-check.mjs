import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(readText(relativePath));
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

const getHeaderMap = () => {
  const vercelConfig = readJson('vercel.json');
  const globalHeaderBlock = (vercelConfig.headers ?? []).find((entry) => entry.source === '/(.*)');
  return new Map((globalHeaderBlock?.headers ?? []).map((header) => [header.key, header.value]));
};

const containsAll = (value, snippets) =>
  typeof value === 'string' && snippets.every((snippet) => value.includes(snippet));

const headerMap = getHeaderMap();
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

const highCostRoutes = [
  'api/billing/checkout.js',
  'api/billing/portal.js',
  'api/billing/status.js',
  'api/v1/ai/attachments/analyze.js',
];

for (const route of highCostRoutes) {
  check(
    `Rate limit wired: ${route}`,
    readText(route).includes('applyRateLimit'),
    'High-cost or sensitive routes should call applyRateLimit before provider work'
  );
}

const aiAttachmentAnalysisRoute = readText('api/v1/ai/attachments/analyze.js');
check(
  'AI attachment analysis requires Firebase auth',
  containsAll(aiAttachmentAnalysisRoute, [
    'verifyFirebaseIdToken',
    'getBearerToken',
    'await verifyFirebaseIdToken(token)',
  ]) &&
    aiAttachmentAnalysisRoute.indexOf('await verifyFirebaseIdToken(token)') <
      aiAttachmentAnalysisRoute.indexOf('const payload = await readJsonBody'),
  'AI attachment analysis must verify the signed-in Firebase user before parsing uploads or calling the AI provider'
);

const webRootLayout = readText('apps/MoneyKai-web/src/app/_layout.tsx');
const webSentry = readText('apps/MoneyKai-web/src/services/sentry.ts');
const webCookieConsent = readText('apps/MoneyKai-web/src/services/cookieConsent.ts');
const webPrivacyPolicy = readText('apps/MoneyKai-web/src/app/privacy-policy.tsx');

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
const publicSourceMaps = webDistFiles.filter((file) => file.endsWith('.map'));
const jsFilesWithSourceMapRefs = webDistFiles.filter(
  (file) => file.endsWith('.js') && fs.readFileSync(file, 'utf8').includes('sourceMappingURL=')
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
