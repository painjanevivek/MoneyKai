import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EAS_JSON_PATH = path.join(ROOT, 'apps', 'MoneyKai-mobile', 'eas.json');

const PROFILE_REQUIREMENTS = {
  preview: {
    distribution: 'internal',
    androidBuildType: 'apk',
  },
  production: {
    autoIncrement: true,
    androidBuildType: 'app-bundle',
  },
};

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--profile') {
      options.profile = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument.startsWith('--profile=')) {
      options.profile = argument.slice('--profile='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function addFailure(failures, message) {
  failures.push(`- ${message}`);
}

function requireEnvironmentValue(failures, environment, name, expectedValue) {
  if (environment[name] !== expectedValue) {
    addFailure(
      failures,
      `${name} must be ${JSON.stringify(expectedValue)}, found ${JSON.stringify(environment[name])}.`,
    );
  }
}

function validateProfile(profileName, profile) {
  const failures = [];
  const requirements = PROFILE_REQUIREMENTS[profileName];
  const environment = profile.env ?? {};
  const android = profile.android ?? {};

  requireEnvironmentValue(failures, environment, 'EXPO_PUBLIC_BUILD_PROFILE', profileName);
  requireEnvironmentValue(failures, environment, 'EXPO_PUBLIC_DEV_CLIENT_BUILD', 'false');
  requireEnvironmentValue(failures, environment, 'EXPO_PUBLIC_SMS_RESEARCH_BUILD', 'false');
  requireEnvironmentValue(failures, environment, 'EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD', 'false');

  if (profile.developmentClient === true) {
    addFailure(failures, 'developmentClient must not be true.');
  }

  if (android.buildType !== requirements.androidBuildType) {
    addFailure(
      failures,
      `android.buildType must be ${JSON.stringify(requirements.androidBuildType)}, found ${JSON.stringify(android.buildType)}.`,
    );
  }

  if (typeof android.gradleCommand === 'string' && /debug|assembleDebug/i.test(android.gradleCommand)) {
    addFailure(failures, `android.gradleCommand must not invoke a debug build: ${android.gradleCommand}`);
  }

  if (profileName === 'preview') {
    if (profile.distribution !== requirements.distribution) {
      addFailure(
        failures,
        `distribution must be ${JSON.stringify(requirements.distribution)}, found ${JSON.stringify(profile.distribution)}.`,
      );
    }
  }

  if (profileName === 'production') {
    if (profile.autoIncrement !== requirements.autoIncrement) {
      addFailure(failures, `autoIncrement must be ${requirements.autoIncrement}.`);
    }

    if (profile.distribution === 'internal' || android.distribution === 'internal') {
      addFailure(failures, 'production must create a store AAB, not an internal-distribution artifact.');
    }
  }

  return failures;
}

try {
  const { profile: profileName } = parseArgs(process.argv.slice(2));

  if (!Object.hasOwn(PROFILE_REQUIREMENTS, profileName)) {
    throw new Error('Use --profile preview or --profile production.');
  }

  const easJson = JSON.parse(readFileSync(EAS_JSON_PATH, 'utf8'));
  const profile = easJson.build?.[profileName];

  if (!profile) {
    throw new Error(`apps/MoneyKai-mobile/eas.json is missing build.${profileName}.`);
  }

  const failures = validateProfile(profileName, profile);

  if (failures.length > 0) {
    console.error(`EAS ${profileName} release profile validation failed:`);
    console.error(failures.join('\n'));
    process.exit(1);
  }

  console.log(`EAS ${profileName} release profile validation passed.`);
} catch (error) {
  console.error(`EAS release profile validation failed: ${error.message}`);
  process.exit(1);
}
