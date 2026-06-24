#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const MOBILE_ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const EAS_JSON_PATH = path.join(MOBILE_ROOT, 'eas.json');
const GRADLE_BUILD_PATH = path.join(MOBILE_ROOT, 'android/app/build.gradle');
const CREDENTIALS_JSON_PATH = path.join(MOBILE_ROOT, 'credentials.json');
const REQUIRED_UPLOAD_ENV = [
  'MONEYKAI_UPLOAD_STORE_FILE',
  'MONEYKAI_UPLOAD_STORE_PASSWORD',
  'MONEYKAI_UPLOAD_KEY_ALIAS',
  'MONEYKAI_UPLOAD_KEY_PASSWORD',
];

function parseArgs(argv) {
  const options = {
    mode: 'eas-production-config',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--mode') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error('--mode requires a value.');
      }
      options.mode = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--mode=')) {
      options.mode = arg.slice('--mode='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`MoneyKai Android production signing verifier

Usage:
  npm run android:verify:production-signing
  npm run android:verify:production-signing -- --mode local-release

Modes:
  eas-production-config  Checks production EAS/Gradle config does not depend on debug/local signing assumptions.
  local-release          Also requires MONEYKAI_UPLOAD_* values and rejects debug keystore/default debug credentials.
`);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function addFailure(failures, message) {
  failures.push(`- ${message}`);
}

function getProductionProfile(easJson, failures) {
  const profile = easJson.build?.production;

  if (!profile) {
    addFailure(failures, 'apps/MoneyKai-mobile/eas.json is missing build.production.');
    return undefined;
  }

  return profile;
}

function validateEasProductionConfig(failures) {
  const easJson = readJson(EAS_JSON_PATH);
  const production = getProductionProfile(easJson, failures);

  if (!production) {
    return;
  }

  const android = production.android ?? {};
  const androidBuildType = android.buildType ?? 'app-bundle';
  const credentialsSource = android.credentialsSource ?? production.credentialsSource ?? 'remote';

  if (production.developmentClient === true) {
    addFailure(failures, 'build.production must not set developmentClient=true.');
  }

  if (production.distribution === 'internal' || android.distribution === 'internal') {
    addFailure(
      failures,
      'build.production must not use distribution=internal; Play internal testing needs a store AAB, not a direct-install APK.',
    );
  }

  if (androidBuildType !== 'app-bundle') {
    addFailure(failures, `build.production.android.buildType must be app-bundle, found "${androidBuildType}".`);
  }

  if (typeof android.gradleCommand === 'string' && /debug|assembleDebug/i.test(android.gradleCommand)) {
    addFailure(failures, `build.production.android.gradleCommand must not be a debug command: ${android.gradleCommand}`);
  }

  if (android.withoutCredentials === true || production.withoutCredentials === true) {
    addFailure(failures, 'build.production must not set withoutCredentials=true.');
  }

  if (credentialsSource === 'local') {
    validateLocalCredentialsJson(failures);
  }
}

function validateLocalCredentialsJson(failures) {
  if (!existsSync(CREDENTIALS_JSON_PATH)) {
    addFailure(
      failures,
      'production credentialsSource=local but credentials.json is absent, so the production keystore cannot be verified.',
    );
    return;
  }

  const credentialsJson = readJson(CREDENTIALS_JSON_PATH);
  const keystore = credentialsJson.android?.keystore;

  if (!keystore) {
    addFailure(failures, 'credentials.json is missing android.keystore for production local credentials.');
    return;
  }

  validateKeystoreIdentity(
    failures,
    {
      storeFile: keystore.keystorePath,
      storePassword: keystore.keystorePassword,
      keyAlias: keystore.keyAlias,
      keyPassword: keystore.keyPassword,
    },
    { requireFileExists: false, sourceLabel: 'credentials.json android.keystore' },
  );
}

function validateGradleSigningConfig(failures) {
  const buildGradle = readFileSync(GRADLE_BUILD_PATH, 'utf8');
  const buildTypesBlock = extractNamedBlock(buildGradle, 'buildTypes') ?? '';
  const releaseBuildTypeBlock = extractNamedBlock(buildTypesBlock, 'release') ?? '';
  const originalBuildTypeBlock = extractNamedBlock(buildTypesBlock, 'original') ?? '';

  if (/signingConfig\s+hasMoneyKaiUploadSigning\s*\?\s*signingConfigs\.release\s*:\s*signingConfigs\.debug/.test(buildGradle)) {
    addFailure(
      failures,
      'android/app/build.gradle still falls back from release signing to signingConfigs.debug when upload signing is missing.',
    );
  }

  if (/signingConfig\s+signingConfigs\.debug/.test(releaseBuildTypeBlock)) {
    addFailure(failures, 'android/app/build.gradle release buildType must not reference signingConfigs.debug.');
  }

  if (/signingConfig\s+signingConfigs\.debug/.test(originalBuildTypeBlock)) {
    addFailure(failures, 'android/app/build.gradle original buildType must not reference signingConfigs.debug.');
  }

  if (!buildGradle.includes('needsUploadSigning && !hasMoneyKaiUploadSigning')) {
    addFailure(failures, 'android/app/build.gradle is missing the release/original upload-signing fail-fast guard.');
  }
}

function extractNamedBlock(text, blockName) {
  const match = new RegExp(`\\b${blockName}\\s*\\{`).exec(text);

  if (!match) {
    return undefined;
  }

  const blockStart = match.index;
  const openBraceIndex = text.indexOf('{', blockStart);
  let depth = 0;

  for (let index = openBraceIndex; index < text.length; index += 1) {
    const char = text[index];

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(blockStart, index + 1);
      }
    }
  }

  return undefined;
}

function getUploadEnv() {
  return {
    storeFile: process.env.MONEYKAI_UPLOAD_STORE_FILE,
    storePassword: process.env.MONEYKAI_UPLOAD_STORE_PASSWORD,
    keyAlias: process.env.MONEYKAI_UPLOAD_KEY_ALIAS,
    keyPassword: process.env.MONEYKAI_UPLOAD_KEY_PASSWORD,
  };
}

function resolveKeystorePath(storeFile) {
  if (!storeFile) {
    return undefined;
  }

  return path.isAbsolute(storeFile)
    ? storeFile
    : path.resolve(MOBILE_ROOT, 'android/app', storeFile);
}

function validateKeystoreIdentity(failures, signing, { requireFileExists, sourceLabel }) {
  const missing = [
    ['storeFile', signing.storeFile],
    ['storePassword', signing.storePassword],
    ['keyAlias', signing.keyAlias],
    ['keyPassword', signing.keyPassword],
  ].filter(([, value]) => !value);

  for (const [field] of missing) {
    addFailure(failures, `${sourceLabel} is missing ${field}.`);
  }

  if (missing.length > 0) {
    return;
  }

  const resolvedStoreFile = resolveKeystorePath(signing.storeFile);
  const normalizedStoreFile = resolvedStoreFile.toLowerCase().replaceAll('\\', '/');

  if (normalizedStoreFile.endsWith('/debug.keystore') || normalizedStoreFile.includes('/.android/debug.keystore')) {
    addFailure(failures, `${sourceLabel} points at a debug keystore: ${resolvedStoreFile}`);
  }

  if (signing.storePassword === 'android') {
    addFailure(failures, `${sourceLabel} uses the default Android debug store password.`);
  }

  if (signing.keyAlias === 'androiddebugkey') {
    addFailure(failures, `${sourceLabel} uses the default Android debug key alias.`);
  }

  if (signing.keyPassword === 'android') {
    addFailure(failures, `${sourceLabel} uses the default Android debug key password.`);
  }

  if (requireFileExists && !existsSync(resolvedStoreFile)) {
    addFailure(failures, `${sourceLabel} keystore file was not found: ${resolvedStoreFile}`);
  }
}

function validateLocalReleaseEnv(failures) {
  const missing = REQUIRED_UPLOAD_ENV.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    addFailure(
      failures,
      `local release builds require upload signing env vars. Missing: ${missing.join(', ')}.`,
    );
    return;
  }

  validateKeystoreIdentity(failures, getUploadEnv(), {
    requireFileExists: true,
    sourceLabel: 'MONEYKAI_UPLOAD_* signing env',
  });
}

try {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (!['eas-production-config', 'local-release'].includes(options.mode)) {
    throw new Error(`Unsupported mode "${options.mode}". Expected eas-production-config or local-release.`);
  }

  const failures = [];

  validateEasProductionConfig(failures);
  validateGradleSigningConfig(failures);

  if (options.mode === 'local-release') {
    validateLocalReleaseEnv(failures);
  }

  if (failures.length > 0) {
    console.error('Android production signing verification failed:');
    console.error(failures.join('\n'));
    process.exit(1);
  }

  console.log(`Android production signing verification passed (${options.mode}).`);
} catch (error) {
  console.error(`Android production signing verification failed: ${error.message}`);
  process.exit(1);
}
