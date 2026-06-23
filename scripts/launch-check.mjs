import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const PLACEHOLDER_PATTERNS = ['placeholder', 'REPLACE_ME', 'your-project', 'your-api-key', 'your-google', 'your-firebase'];
const PRODUCTION_WEB_AUTH_PROXY_HOSTS = ['moneykai.com', 'www.moneykai.com'];

const readEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const values = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    values[key] = value;
  }

  return values;
};

const readTextFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf8');
};

const readJsonFile = (filePath) => {
  const raw = readTextFile(filePath);
  if (!raw) {
    return null;
  }

  return JSON.parse(raw);
};

const readExportedStringArray = (source, exportName) => {
  if (!source) {
    return [];
  }

  const match = source.match(new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s+as\\s+const`));
  if (!match) {
    return [];
  }

  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((valueMatch) => valueMatch[1]);
};

const isRealValue = (value) =>
  typeof value === 'string' &&
  value.length > 0 &&
  !PLACEHOLDER_PATTERNS.some((pattern) => value.includes(pattern));

const printSection = (title) => {
  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
};

const printStatus = (label, ok, details) => {
  const state = ok ? 'PASS' : 'FAIL';
  console.log(`[${state}] ${label}${details ? ` - ${details}` : ''}`);
};

const relativePath = (filePath) => path.relative(root, filePath).replaceAll(path.sep, '/');

const printEnvFileStatus = (label, env, filePath) => {
  printStatus(label, Boolean(env), env ? `Found ${relativePath(filePath)}` : `Missing ${relativePath(filePath)}`);
};

const isBackendDir = (directory) =>
  typeof directory === 'string' &&
  fs.existsSync(path.join(directory, 'requirements.txt')) &&
  fs.existsSync(path.join(directory, 'app', 'main.py'));

const resolveBackendDir = () => {
  const candidates = [
    process.env.MONEYKAI_BACKEND_DIR,
    path.resolve(root, '..', 'MoneyKai-backend'),
    path.join(root, 'backend'),
  ].filter(Boolean);

  return candidates.find(isBackendDir) ?? null;
};

const mobileEnvPath = path.join(root, 'apps', 'MoneyKai-mobile', '.env');
const webEnvPath = path.join(root, 'apps', 'MoneyKai-web', '.env');
const webFirebaseServicePath = path.join(root, 'apps', 'MoneyKai-web', 'src', 'services', 'firebase.ts');
const webAuthStorePath = path.join(root, 'apps', 'MoneyKai-web', 'src', 'stores', 'useAuthStore.ts');
const webTabsLayoutPath = path.join(root, 'apps', 'MoneyKai-web', 'src', 'app', '(tabs)', '_layout.tsx');
const webFirebaseAuthConfigPath = path.join(root, 'apps', 'MoneyKai-web', 'src', 'config', 'firebaseAuthWeb.ts');
const vercelConfigPath = path.join(root, 'vercel.json');
const backendDir = resolveBackendDir();
const backendEnvPath = backendDir ? path.join(backendDir, '.env') : null;

const mobileEnv = readEnvFile(mobileEnvPath);
const webEnv = readEnvFile(webEnvPath);
const backendEnv = backendEnvPath ? readEnvFile(backendEnvPath) : null;
const webFirebaseServiceSource = readTextFile(webFirebaseServicePath);
const webAuthStoreSource = readTextFile(webAuthStorePath);
const webTabsLayoutSource = readTextFile(webTabsLayoutPath);
const webFirebaseAuthConfigSource = readTextFile(webFirebaseAuthConfigPath);
const vercelConfig = readJsonFile(vercelConfigPath);

printSection('MoneyKai Launch Audit');

printEnvFileStatus('Mobile app .env', mobileEnv, mobileEnvPath);
printEnvFileStatus('Web app .env', webEnv, webEnvPath);

printSection('Firebase Client Setup');

const firebaseKeys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const auditFirebaseEnv = (appLabel, env) => {
  for (const key of firebaseKeys) {
    const value = env?.[key] ?? '';
    printStatus(
      `${appLabel} ${key}`,
      isRealValue(value),
      isRealValue(value) ? 'Configured' : 'Missing or placeholder'
    );
  }
};

auditFirebaseEnv('Mobile', mobileEnv);
auditFirebaseEnv('Web', webEnv);

printSection('Firebase Client Parity');

for (const key of firebaseKeys) {
  const mobileValue = mobileEnv?.[key] ?? '';
  const webValue = webEnv?.[key] ?? '';
  const valuesMatch = isRealValue(mobileValue) && mobileValue === webValue;
  printStatus(
    key,
    valuesMatch,
    valuesMatch ? 'Mobile and web match' : 'Mobile and web differ or one side is missing'
  );
}

printSection('Web Auth Stabilization');

const webAuthDomain = webEnv?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '';
const webProjectId = webEnv?.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const firebaseProjectAuthDomain = isRealValue(webProjectId) ? `${webProjectId}.firebaseapp.com` : '';
const authDomainUsesFirebaseProject =
  isRealValue(webAuthDomain) &&
  isRealValue(firebaseProjectAuthDomain) &&
  webAuthDomain === firebaseProjectAuthDomain;

printStatus(
  'Web Firebase authDomain',
  authDomainUsesFirebaseProject,
  authDomainUsesFirebaseProject
    ? webAuthDomain
    : 'Use the Firebase project auth domain in EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN; runtime host swap happens in app code'
);

const configuredProxyHosts = readExportedStringArray(webFirebaseAuthConfigSource, 'FIREBASE_AUTH_PROXY_HOSTS');
const configuredAuthHelperPaths = readExportedStringArray(webFirebaseAuthConfigSource, 'FIREBASE_AUTH_HELPER_PATHS');
const proxyHostsReady = PRODUCTION_WEB_AUTH_PROXY_HOSTS.every((host) => configuredProxyHosts.includes(host));

printStatus(
  'Production auth proxy hosts',
  proxyHostsReady,
  proxyHostsReady ? configuredProxyHosts.join(', ') : `Expected ${PRODUCTION_WEB_AUTH_PROXY_HOSTS.join(', ')}`
);

const authHelperPathsReady = ['/__/auth', '/__/auth/:path*', '/__/firebase/init.json'].every((authPath) =>
  configuredAuthHelperPaths.includes(authPath)
);
printStatus(
  'Firebase auth helper path config',
  authHelperPathsReady,
  authHelperPathsReady ? configuredAuthHelperPaths.join(', ') : 'Missing required Firebase auth helper proxy paths'
);

const rewriteTargets = new Map((vercelConfig?.rewrites ?? []).map((rewrite) => [rewrite.source, rewrite.destination]));
const rewritesMatchAuthDomain =
  authDomainUsesFirebaseProject &&
  configuredAuthHelperPaths.length > 0 &&
  configuredAuthHelperPaths.every((authPath) => rewriteTargets.get(authPath) === `https://${webAuthDomain}${authPath}`);

printStatus(
  'Vercel Firebase auth helper rewrites',
  rewritesMatchAuthDomain,
  rewritesMatchAuthDomain
    ? `All auth helper paths proxy to ${webAuthDomain}`
    : 'vercel.json rewrites must match EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'
);

const usesRuntimeAuthDomainSwap =
  webFirebaseServiceSource?.includes('getWebAuthDomain(configuredAuthDomain, window.location.hostname)') ?? false;
printStatus(
  'Web runtime authDomain swap',
  usesRuntimeAuthDomainSwap,
  usesRuntimeAuthDomainSwap ? 'Production hosts use the current browser hostname' : 'Firebase web service is not using firebaseAuthWeb host config'
);

const waitsForAuthState =
  (webFirebaseServiceSource?.includes('export const waitForAuthState') ?? false) &&
  (webFirebaseServiceSource?.includes('onAuthStateChanged(firebaseAuth') ?? false) &&
  (webFirebaseServiceSource?.includes('unsubscribe();') ?? false);
const hydrationAwaitIndex = webAuthStoreSource?.indexOf('await waitForAuthState()') ?? -1;
const hydrationClearIndex = webAuthStoreSource?.lastIndexOf('isHydratingSession: false') ?? -1;
const storeHydratesBeforeClearing = hydrationAwaitIndex >= 0 && hydrationClearIndex > hydrationAwaitIndex;

printStatus(
  'Auth hydration smoke guard',
  waitsForAuthState && storeHydratesBeforeClearing,
  waitsForAuthState && storeHydratesBeforeClearing
    ? 'hydrateSession waits for Firebase auth state before clearing hydration'
    : 'hydrateSession must await waitForAuthState before protected-route redirects can run'
);

const protectedRoutesWaitForHydration =
  webTabsLayoutSource?.includes('!isHydratingSession && !isAuthenticated') ?? false;
printStatus(
  'Protected-route hydration gate',
  protectedRoutesWaitForHydration,
  protectedRoutesWaitForHydration ? 'Signed-out redirects wait for hydration' : 'Protected routes may redirect before auth hydration completes'
);

const googleKeys = [
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
];

printSection('Google Sign-In');

for (const key of googleKeys) {
  const value = mobileEnv?.[key] ?? '';
  const configured = isRealValue(value);
  printStatus(key, configured, configured ? 'Configured' : 'Optional until Google sign-in is verified live');
}

printSection('Store Review Links');

for (const key of ['EXPO_PUBLIC_APP_STORE_URL', 'EXPO_PUBLIC_PLAY_STORE_URL']) {
  const value = mobileEnv?.[key] ?? '';
  const configured = isRealValue(value);
  printStatus(key, configured, configured ? 'Configured' : 'Optional; falls back to store search');
}

printSection('Backend Admin Setup');

if (!backendEnv) {
  const details = backendDir ? `Missing ${path.relative(root, backendEnvPath)}` : 'Missing sibling MoneyKai-backend repo or backend/.env';
  printStatus('Backend .env', false, details);
} else {
  printStatus('Backend .env', true, `Found ${path.relative(root, backendEnvPath)}`);
}

const projectId = backendEnv?.FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID ?? '';
const storageBucket = backendEnv?.FIREBASE_STORAGE_BUCKET ?? process.env.FIREBASE_STORAGE_BUCKET ?? '';
const serviceAccountPath =
  backendEnv?.FIREBASE_SERVICE_ACCOUNT_PATH ??
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  '';
const serviceAccountJson =
  backendEnv?.FIREBASE_SERVICE_ACCOUNT_JSON ??
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
  '';

printStatus('FIREBASE_PROJECT_ID', isRealValue(projectId), isRealValue(projectId) ? projectId : 'Missing');
printStatus('FIREBASE_STORAGE_BUCKET', isRealValue(storageBucket), isRealValue(storageBucket) ? storageBucket : 'Missing');

const serviceAccountExists = serviceAccountPath.length > 0 && fs.existsSync(serviceAccountPath);
const serviceAccountJsonConfigured = isRealValue(serviceAccountJson);
printStatus(
  'Firebase Admin credentials',
  serviceAccountExists || serviceAccountJsonConfigured,
  serviceAccountExists
    ? serviceAccountPath
    : serviceAccountJsonConfigured
      ? 'Configured via FIREBASE_SERVICE_ACCOUNT_JSON'
      : 'Missing backend credential path/file or FIREBASE_SERVICE_ACCOUNT_JSON'
);

printSection('Manual Verification Still Required');
console.log('- Firebase Authentication providers must still be checked in Firebase Console.');
console.log('- Firestore backup and restore still need one real signed-in account test.');
console.log('- Notification delivery and tap routing still need a physical device pass.');
console.log('- Cross-device restore still needs a second device or a fresh install verification.');
