import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const PLACEHOLDER_PATTERNS = ['placeholder', 'REPLACE_ME', 'your-project', 'your-api-key', 'your-google', 'your-firebase'];

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
    const value = trimmed.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  return values;
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

const mobileEnvPath = path.join(root, 'apps', 'MoneyKai-mobile', '.env');
const backendEnvPath = path.join(root, 'backend', '.env');

const mobileEnv = readEnvFile(mobileEnvPath);
const backendEnv = readEnvFile(backendEnvPath);

printSection('MoneyKai Launch Audit');

if (!mobileEnv) {
  printStatus('Mobile app .env', false, 'Missing apps/MoneyKai-mobile/.env');
} else {
  printStatus('Mobile app .env', true, 'Found apps/MoneyKai-mobile/.env');
}

printSection('Firebase Client Setup');

const firebaseKeys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

for (const key of firebaseKeys) {
  const value = mobileEnv?.[key] ?? '';
  printStatus(key, isRealValue(value), isRealValue(value) ? 'Configured' : 'Missing or placeholder');
}

printSection('Google Sign-In');

const googleKeys = [
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
];

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
  printStatus('Backend .env', false, 'Missing backend/.env');
} else {
  printStatus('Backend .env', true, 'Found backend/.env');
}

const projectId = backendEnv?.FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID ?? '';
const storageBucket = backendEnv?.FIREBASE_STORAGE_BUCKET ?? process.env.FIREBASE_STORAGE_BUCKET ?? '';
const serviceAccountPath =
  backendEnv?.FIREBASE_SERVICE_ACCOUNT_PATH ??
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
  process.env.GOOGLE_APPLICATION_CREDENTIALS ??
  '';

printStatus('FIREBASE_PROJECT_ID', isRealValue(projectId), isRealValue(projectId) ? projectId : 'Missing');
printStatus('FIREBASE_STORAGE_BUCKET', isRealValue(storageBucket), isRealValue(storageBucket) ? storageBucket : 'Missing');

const serviceAccountExists = serviceAccountPath.length > 0 && fs.existsSync(serviceAccountPath);
printStatus(
  'Firebase Admin credentials',
  serviceAccountExists,
  serviceAccountExists ? serviceAccountPath : 'Missing backend credential path or file'
);

printSection('Manual Verification Still Required');
console.log('- Firebase Authentication providers must still be checked in Firebase Console.');
console.log('- Firestore backup and restore still need one real signed-in account test.');
console.log('- Notification delivery and tap routing still need a physical device pass.');
console.log('- Cross-device restore still needs a second device or a fresh install verification.');

