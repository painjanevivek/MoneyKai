#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const MOBILE_ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const WORKSPACE_ROOT = path.resolve(MOBILE_ROOT, '../..');
const DEFAULT_AAB_PATH = 'android/app/build/outputs/bundle/release/app-release.aab';

function parseArgs(argv) {
  const options = {
    artifactPath: process.env.MONEYKAI_ANDROID_RELEASE_ARTIFACT || DEFAULT_AAB_PATH,
    signing: process.env.MONEYKAI_ANDROID_SIGNING_EXPECTATION || 'EAS-managed Android credentials or verified non-debug upload key',
    testerGroup: process.env.MONEYKAI_TESTER_GROUP || 'Internal testers',
    allowDebugSigning: process.env.MONEYKAI_ALLOW_DEBUG_SIGNING === 'true',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--allow-debug-signing') {
      options.allowDebugSigning = true;
      continue;
    }

    if (['--aab', '--apk', '--artifact', '--build-id', '--eas-url', '--signing', '--tester-group'].includes(arg)) {
      const next = argv[index + 1];
      if (!next) {
        throw new Error(`${arg} requires a value.`);
      }

      setOption(options, arg.slice(2), next);
      index += 1;
      continue;
    }

    const equalsIndex = arg.indexOf('=');
    if (equalsIndex > 0) {
      const key = arg.slice(0, equalsIndex);
      const value = arg.slice(equalsIndex + 1);

      if (['--aab', '--apk', '--artifact', '--build-id', '--eas-url', '--signing', '--tester-group'].includes(key)) {
        setOption(options, key.slice(2), value);
        continue;
      }
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function setOption(options, key, value) {
  if (key === 'aab' || key === 'apk' || key === 'artifact') {
    options.artifactPath = value;
    return;
  }

  if (key === 'build-id') {
    options.buildId = value;
    return;
  }

  if (key === 'eas-url') {
    options.easUrl = value;
    return;
  }

  if (key === 'tester-group') {
    options.testerGroup = value;
    return;
  }

  options[key] = value;
}

function printHelp() {
  console.log(`MoneyKai Android internal-testing handoff capture

Usage:
  npm run android:capture:handoff -- --aab path/to/production.aab --build-id EAS_BUILD_ID --eas-url https://expo.dev/...

Options:
  --aab, --apk, --artifact  Candidate Android artifact to verify and hash.
  --build-id               EAS build ID or local bundle run identifier.
  --eas-url                EAS build URL.
  --signing                Signing expectation to print in the handoff block.
  --tester-group           Tester group label. Defaults to "Internal testers".
  --allow-debug-signing    Testing-only escape hatch for historical/debug artifacts.

The script runs the release permission verifier against the exact artifact, computes SHA-256, reads app metadata,
captures the current git commit and signer certificate, and prints a Markdown block for docs/phase5-internal-release-signoff.md.
`);
}

function resolveArtifactPath(artifactPath) {
  if (path.isAbsolute(artifactPath)) {
    return artifactPath;
  }

  const cwdCandidate = path.resolve(process.cwd(), artifactPath);
  if (existsSync(cwdCandidate)) {
    return cwdCandidate;
  }

  const workspaceCandidate = path.resolve(WORKSPACE_ROOT, artifactPath);
  if (existsSync(workspaceCandidate)) {
    return workspaceCandidate;
  }

  return path.resolve(MOBILE_ROOT, artifactPath);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? MOBILE_ROOT,
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function getGitValue(args) {
  try {
    return run('git', args, { cwd: MOBILE_ROOT });
  } catch {
    return 'unavailable';
  }
}

function getSha256(filePath) {
  const hash = createHash('sha256');
  hash.update(readFileSync(filePath));
  return hash.digest('hex').toUpperCase();
}

function getAndroidGradleMetadata() {
  const buildGradlePath = path.join(MOBILE_ROOT, 'android/app/build.gradle');

  if (!existsSync(buildGradlePath)) {
    return {};
  }

  const buildGradle = readFileSync(buildGradlePath, 'utf8');
  const versionCode = /\bversionCode\s+(\d+)/.exec(buildGradle)?.[1];
  const versionName = /\bversionName\s+["']([^"']+)["']/.exec(buildGradle)?.[1];
  const applicationId = /\bapplicationId\s+["']([^"']+)["']/.exec(buildGradle)?.[1];
  const targetSdk = /\btargetSdkVersion\s+rootProject\.ext\.targetSdkVersion/.test(buildGradle) ? 'rootProject.ext.targetSdkVersion' : undefined;

  return {
    applicationId,
    targetSdk,
    versionCode,
    versionName,
  };
}

function verifyReleasePermissions(artifactPath) {
  const verifierPath = path.join(MOBILE_ROOT, 'scripts/verify-android-release-permissions.mjs');
  return run(process.execPath, [verifierPath, '--artifact', artifactPath]);
}

function getSignerSummary(artifactPath) {
  const output = run('keytool', ['-printcert', '-jarfile', artifactPath]);
  const owner = /^Owner:\s*(.+)$/m.exec(output)?.[1] ?? 'unavailable';
  const sha256 = /^\s*SHA256:\s*(.+)$/m.exec(output)?.[1] ?? 'unavailable';
  const signatureAlgorithm = /^Signature algorithm name:\s*(.+)$/m.exec(output)?.[1] ?? 'unavailable';

  return {
    isDebugSigner: /CN=Android Debug\b/i.test(owner),
    owner,
    sha256,
    signatureAlgorithm,
  };
}

try {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const absoluteArtifactPath = resolveArtifactPath(options.artifactPath);

  if (!existsSync(absoluteArtifactPath)) {
    throw new Error(`Android artifact was not found: ${absoluteArtifactPath}`);
  }

  const permissionOutput = verifyReleasePermissions(absoluteArtifactPath);
  const signer = getSignerSummary(absoluteArtifactPath);

  if (signer.isDebugSigner && !options.allowDebugSigning) {
    throw new Error(
      `Artifact is signed with the Android debug certificate (${signer.owner}). Rebuild with EAS-managed Android credentials or a verified non-debug upload key.`,
    );
  }

  const packageJson = readJson(path.join(MOBILE_ROOT, 'package.json'));
  const gradleMetadata = getAndroidGradleMetadata();
  const shortCommit = getGitValue(['rev-parse', '--short', 'HEAD']);
  const fullCommit = getGitValue(['rev-parse', 'HEAD']);
  const branch = getGitValue(['rev-parse', '--abbrev-ref', 'HEAD']);
  const sha256 = getSha256(absoluteArtifactPath);

  console.log('MoneyKai Android internal-testing handoff capture complete.');
  console.log('');
  console.log('| Field | Value |');
  console.log('| --- | --- |');
  console.log(`| Build ID | ${options.buildId ?? 'Pending entry'} |`);
  console.log(`| EAS build URL | ${options.easUrl ?? 'Pending entry'} |`);
  console.log(`| Commit hash | \`${shortCommit}\` / \`${fullCommit}\` |`);
  console.log(`| Branch | \`${branch}\` |`);
  console.log(`| App version | \`${gradleMetadata.versionName ?? packageJson.version}\` |`);
  console.log(`| Android package | \`${gradleMetadata.applicationId ?? 'com.moneykai.mobile'}\` |`);
  console.log(`| Version code | \`${gradleMetadata.versionCode ?? 'remote/EAS managed'}\` |`);
  console.log(`| Build profile | \`production\` |`);
  console.log(`| Signing expectation | ${options.signing} |`);
  console.log(`| Artifact signer | ${signer.owner} |`);
  console.log(`| Artifact signer SHA-256 | \`${signer.sha256}\` |`);
  console.log(`| Artifact signature algorithm | \`${signer.signatureAlgorithm}\` |`);
  console.log(`| Artifact path | \`${absoluteArtifactPath}\` |`);
  console.log(`| Artifact SHA-256 | \`${sha256}\` |`);
  console.log(`| Tester group | ${options.testerGroup} |`);
  console.log('| Release permission verifier result | Passed; no restricted SMS permissions detected in the exact artifact. |');
  console.log('');
  console.log('Permission verifier output:');
  console.log('```text');
  console.log(permissionOutput);
  console.log('```');
} catch (error) {
  console.error(`Android handoff capture failed: ${error.message}`);
  process.exit(1);
}
