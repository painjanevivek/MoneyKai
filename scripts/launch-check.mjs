import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFailures = [];

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

const printStatus = (label, ok, details, required = true) => {
  const state = ok ? 'PASS' : 'FAIL';
  console.log(`[${state}] ${label}${details ? ` - ${details}` : ''}`);
  if (!ok && required) {
    requiredFailures.push(label);
  }
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
const webBackupServicePath = path.join(root, 'apps', 'MoneyKai-web', 'src', 'services', 'backupService.ts');
const mobileBackupServicePath = path.join(root, 'apps', 'MoneyKai-mobile', 'src', 'services', 'backupService.ts');
const webProfileEditPath = path.join(root, 'apps', 'MoneyKai-web', 'src', 'app', 'profile-edit.tsx');
const mobileProfileEditPath = path.join(root, 'apps', 'MoneyKai-mobile', 'src', 'screens', 'app', 'ProfileEditScreen.tsx');
const mobileAuthStorePath = path.join(root, 'apps', 'MoneyKai-mobile', 'src', 'stores', 'useAuthStore.ts');
const webBackendApiPath = path.join(root, 'apps', 'MoneyKai-web', 'src', 'services', 'backendApi.ts');
const mobileBackendApiPath = path.join(root, 'apps', 'MoneyKai-mobile', 'src', 'services', 'backendApi.ts');
const firestoreRulesPath = path.join(root, 'firestore.rules');
const webPrivacyPolicyPath = path.join(root, 'apps', 'MoneyKai-web', 'src', 'app', 'privacy-policy.tsx');
const mobilePrivacyPolicyPath = path.join(root, 'apps', 'MoneyKai-mobile', 'src', 'app', 'privacy-policy.tsx');
const mobileEnvironmentConfigPath = path.join(root, 'apps', 'MoneyKai-mobile', 'src', 'config', 'environment.ts');
const apiHttpHelperPath = path.join(root, 'api', '_lib', 'http.js');
const billingCheckoutPath = path.join(root, 'api', 'billing', 'checkout.js');
const aiAttachmentAnalyzePath = path.join(root, 'api', 'v1', 'ai', 'attachments', 'analyze.js');
const persistenceBoundaryDocPath = path.join(root, 'docs', 'backend-first-persistence.md');
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
const webBackupServiceSource = readTextFile(webBackupServicePath);
const mobileBackupServiceSource = readTextFile(mobileBackupServicePath);
const webProfileEditSource = readTextFile(webProfileEditPath);
const mobileProfileEditSource = readTextFile(mobileProfileEditPath);
const mobileAuthStoreSource = readTextFile(mobileAuthStorePath);
const webBackendApiSource = readTextFile(webBackendApiPath);
const mobileBackendApiSource = readTextFile(mobileBackendApiPath);
const firestoreRulesSource = readTextFile(firestoreRulesPath);
const webPrivacyPolicySource = readTextFile(webPrivacyPolicyPath);
const mobilePrivacyPolicySource = readTextFile(mobilePrivacyPolicyPath);
const mobileEnvironmentConfigSource = readTextFile(mobileEnvironmentConfigPath);
const apiHttpHelperSource = readTextFile(apiHttpHelperPath);
const billingCheckoutSource = readTextFile(billingCheckoutPath);
const aiAttachmentAnalyzeSource = readTextFile(aiAttachmentAnalyzePath);
const persistenceBoundaryDocSource = readTextFile(persistenceBoundaryDocPath);
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

printSection('Signed-In Backup/Restore Path');

const appProfilesUseFirebaseUid =
  Boolean(webAuthStoreSource?.includes('id: user.uid')) &&
  Boolean(mobileAuthStoreSource?.includes('id: user.uid'));
printStatus(
  'App profile id source',
  appProfilesUseFirebaseUid,
  appProfilesUseFirebaseUid
    ? 'Web and mobile app profiles use the Firebase UID'
    : 'Signed-in app profiles must use the Firebase UID so Firestore user paths match request.auth.uid'
);

const backupSnapshotsCarryProfile =
  [webBackupServiceSource, mobileBackupServiceSource].every((source) =>
    ['id: user.id', 'email: user.email', 'full_name: user.full_name', 'avatar_url: user.avatar_url', 'auth_provider: user.auth_provider'].every(
      (snippet) => source?.includes(snippet)
    )
  ) &&
  [webBackupServiceSource, mobileBackupServiceSource].every((source) =>
    ['dob: user.dob', 'gender: user.gender'].every((snippet) => source?.includes(snippet))
  );
printStatus(
  'Backup profile payload',
  backupSnapshotsCarryProfile,
  backupSnapshotsCarryProfile
    ? 'Backup snapshots include account identity, avatar, provider, DOB, and gender profile fields'
    : 'Backup snapshots should carry the signed-in profile fields restored by profile edit'
);

const backupIdentityGuard =
  [webBackupServiceSource, mobileBackupServiceSource].every((source) =>
    Boolean(source?.includes('firebaseUser.uid !== user.id')) &&
    Boolean(source?.includes('The signed-in Firebase account does not match the local MoneyKai profile'))
  );
printStatus(
  'Firebase UID backup guard',
  backupIdentityGuard,
  backupIdentityGuard
    ? 'Manual and automatic backup paths fail early when Firebase UID and local profile id diverge'
    : 'Backup paths should reject mismatched Firebase UID/local profile ids before Firestore writes'
);

const restoresProfileFromBackup =
  [webBackupServiceSource, mobileBackupServiceSource].every((source) =>
    Boolean(source?.includes('useAuthStore.setState((state)')) &&
    ['full_name: snapshot.profile.full_name', 'avatar_url: snapshot.profile.avatar_url', 'dob: snapshot.profile.dob', 'gender: snapshot.profile.gender'].every(
      (snippet) => source?.includes(snippet)
    )
  );
printStatus(
  'Restore profile hydration',
  restoresProfileFromBackup,
  restoresProfileFromBackup
    ? 'Restore refreshes the local signed-in profile from the backup snapshot'
    : 'Restore should refresh local profile metadata as well as finance data'
);

const webFirebaseProfileWriteIndex = webProfileEditSource?.indexOf('await updateFirebaseProfile(firebaseAuth.currentUser') ?? -1;
const webLocalProfileWriteIndex = webProfileEditSource?.indexOf('updateProfile({') ?? -1;
const mobileFirebaseProfileWriteIndex = mobileProfileEditSource?.indexOf('await updateFirebaseUserProfile(firebaseUser') ?? -1;
const mobileLocalProfileWriteIndex = mobileProfileEditSource?.indexOf('updateProfile({') ?? -1;
const profileEditWritesFirebaseFirst =
  webFirebaseProfileWriteIndex >= 0 &&
  webLocalProfileWriteIndex > webFirebaseProfileWriteIndex &&
  mobileFirebaseProfileWriteIndex >= 0 &&
  mobileLocalProfileWriteIndex > mobileFirebaseProfileWriteIndex;
printStatus(
  'Profile edit persistence order',
  profileEditWritesFirebaseFirst,
  profileEditWritesFirebaseFirst
    ? 'Profile edit updates Firebase Auth before queuing the local backup-backed profile update'
    : 'Profile edit should update Firebase Auth before local profile state changes are queued for backup'
);

const firestoreBackupRulesReady =
  Boolean(firestoreRulesSource?.includes('match /backups/{document}')) &&
  Boolean(firestoreRulesSource?.includes('allow read, write: if isOwner(userId);'));
printStatus(
  'Firestore backup owner rule',
  firestoreBackupRulesReady,
  firestoreBackupRulesReady
    ? 'users/{uid}/backups is owner-scoped for signed-in Firebase users'
    : 'Firestore rules must allow only the signed-in owner to read/write users/{uid}/backups'
);

const backendBackupClientRoutesReady =
  [webBackendApiSource, mobileBackendApiSource].every((source) =>
    ['/v1/backups', '/v1/backups/latest', '/v1/backups/restore-latest'].every((route) => source?.includes(route))
  );
printStatus(
  'Backend backup client routes',
  backendBackupClientRoutesReady,
  backendBackupClientRoutesReady
    ? 'Web and mobile clients point at create/latest/restore backup routes when backend mode is enabled'
    : 'Backend-enabled backup mode needs create, latest, and restore-latest client routes'
);

printSection('Pre-launch Security Checklist');

const privacyPolicyRequirements = [
  'Firebase cloud backup',
  'Gmail sync',
  'Financial AI',
  'local diagnostics',
  'notification capture',
];
const privacyPolicyHasDeletionDisclosure = (source) =>
  source?.includes('Retention and deletion') || source?.includes('Deletion and retention');
const webPrivacyCoversSensitiveFeatures =
  Boolean(webPrivacyPolicySource) &&
  privacyPolicyRequirements.every((phrase) => webPrivacyPolicySource.includes(phrase)) &&
  privacyPolicyHasDeletionDisclosure(webPrivacyPolicySource);
const mobilePrivacyCoversSensitiveFeatures =
  Boolean(mobilePrivacyPolicySource) &&
  privacyPolicyRequirements.every((phrase) => mobilePrivacyPolicySource.includes(phrase)) &&
  privacyPolicyHasDeletionDisclosure(mobilePrivacyPolicySource);

printStatus(
  'Privacy policy coverage',
  webPrivacyCoversSensitiveFeatures && mobilePrivacyCoversSensitiveFeatures,
  webPrivacyCoversSensitiveFeatures && mobilePrivacyCoversSensitiveFeatures
    ? 'Web and mobile privacy pages disclose cloud backup, Gmail, AI, capture, diagnostics, and deletion'
    : 'Privacy pages should disclose cloud backup, Gmail, AI, capture, diagnostics, and deletion'
);

const knowsDataStorageBoundary =
  Boolean(persistenceBoundaryDocSource) &&
  persistenceBoundaryDocSource.includes('Backend-owned collections') &&
  persistenceBoundaryDocSource.includes('Transitional client-owned collections');

printStatus(
  'User data storage boundary',
  knowsDataStorageBoundary,
  knowsDataStorageBoundary
    ? `Documented in ${relativePath(persistenceBoundaryDocPath)}`
    : 'Missing backend/client data ownership documentation'
);

const globalHeaders = (vercelConfig?.headers ?? []).find((entry) => entry.source === '/(.*)')?.headers ?? [];
const headerValues = new Map(globalHeaders.map((header) => [header.key, header.value]));
const requiredSecurityHeaders = [
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
const hasRequiredSecurityHeaders = requiredSecurityHeaders.every((header) => headerValues.has(header));

const cspValue = headerValues.get('Content-Security-Policy') ?? '';
const cspHasOwaspBaseline =
  [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].every((directive) => cspValue.includes(directive));

printStatus(
  'Web security headers',
  hasRequiredSecurityHeaders && cspHasOwaspBaseline,
  hasRequiredSecurityHeaders && cspHasOwaspBaseline
    ? requiredSecurityHeaders.join(', ')
    : `Missing one of: ${requiredSecurityHeaders.join(', ')} or required CSP baseline directives`
);

const apiResponsesHardened =
  Boolean(apiHttpHelperSource) &&
  apiHttpHelperSource.includes("res.setHeader('Cache-Control', 'no-store')") &&
  apiHttpHelperSource.includes("res.setHeader('X-Content-Type-Options', 'nosniff')") &&
  apiHttpHelperSource.includes("res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')");

printStatus(
  'API response hardening',
  apiResponsesHardened,
  apiResponsesHardened ? 'JSON helper adds no-store and baseline security headers' : 'API JSON helper is missing no-store/security headers'
);

const apiRateLimitsReady =
  Boolean(apiHttpHelperSource) &&
  apiHttpHelperSource.includes('applyRateLimit') &&
  Boolean(billingCheckoutSource?.includes('applyRateLimit')) &&
  Boolean(aiAttachmentAnalyzeSource?.includes('applyRateLimit'));

printStatus(
  'Billable API rate limits',
  apiRateLimitsReady,
  apiRateLimitsReady ? 'Stripe checkout and AI attachment analysis are rate-limited' : 'Billable API routes should call applyRateLimit'
);

const mobileRuntimeAvoidsServerSentryNames =
  Boolean(mobileEnvironmentConfigSource) &&
  ![
    'process.env.SENTRY_DSN',
    'process.env.SENTRY_AUTH_TOKEN',
    'process.env.SENTRY_ORG',
    'process.env.SENTRY_PROJECT',
  ].some((snippet) => mobileEnvironmentConfigSource.includes(snippet));

printStatus(
  'Server-only env separation',
  mobileRuntimeAvoidsServerSentryNames,
  mobileRuntimeAvoidsServerSentryNames
    ? 'Mobile runtime config reads only EXPO_PUBLIC_* values'
    : 'Mobile runtime config should not read server-only Sentry/build secrets'
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
  printStatus(key, configured, configured ? 'Configured' : 'Optional until Google sign-in is verified live', false);
}

printSection('Store Review Links');

for (const key of ['EXPO_PUBLIC_APP_STORE_URL', 'EXPO_PUBLIC_PLAY_STORE_URL']) {
  const value = mobileEnv?.[key] ?? '';
  const configured = isRealValue(value);
  printStatus(key, configured, configured ? 'Configured' : 'Optional; falls back to store search', false);
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

if (requiredFailures.length > 0) {
  console.error(`\nLaunch audit failed: ${requiredFailures.length} required check(s) need attention.`);
  process.exitCode = 1;
} else {
  console.log('\nLaunch audit passed.');
}
