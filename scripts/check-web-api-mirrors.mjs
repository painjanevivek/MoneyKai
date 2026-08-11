import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const mirroredFiles = [
  ['api/_lib/http.js', 'apps/MoneyKai-web/api/_lib/http.js'],
  ['api/_lib/google-oauth.js', 'apps/MoneyKai-web/api/_lib/google-oauth.js'],
  ['api/_lib/google-oauth-router.js', 'apps/MoneyKai-web/api/_lib/google-oauth-router.js'],
  ['api/_lib/firebase-identity.js', 'apps/MoneyKai-web/api/_lib/firebase-identity.js'],
  ['api/auth-google.js', 'apps/MoneyKai-web/api/auth-google.js'],
  ['api/v1/auth/google/start.js', 'apps/MoneyKai-web/api/v1/auth/google/start.js'],
  ['api/v1/auth/google/callback.js', 'apps/MoneyKai-web/api/v1/auth/google/callback.js'],
  ['api/v1/auth/google/exchange.js', 'apps/MoneyKai-web/api/v1/auth/google/exchange.js'],
  ['api/v1/auth/google/setup-status.js', 'apps/MoneyKai-web/api/v1/auth/google/setup-status.js'],
];

const hashFile = (path) =>
  createHash('sha256')
    .update(readFileSync(path))
    .digest('hex');

const mismatches = mirroredFiles.filter(([source, copy]) => hashFile(source) !== hashFile(copy));
const vercelIgnore = readFileSync('.vercelignore', 'utf8');
const restoredV1Rules = vercelIgnore
  .split(/\r?\n/)
  .filter((rule) => rule.startsWith('!api/v1/'));
const requiredGoogleAuthRewrites = [
  ['/api/v1/auth/google/start', '/api/auth-google?action=start'],
  ['/api/v1/auth/google/callback', '/api/auth-google?action=callback'],
  ['/api/v1/auth/google/exchange', '/api/auth-google?action=exchange'],
  ['/api/v1/auth/google/setup-status', '/api/auth-google?action=setup-status'],
];

const readVercelRewrites = (path) => {
  const config = JSON.parse(readFileSync(path, 'utf8'));
  return Array.isArray(config.rewrites) ? config.rewrites : [];
};

const missingRewriteMessages = ['vercel.json', 'apps/MoneyKai-web/vercel.json'].flatMap((path) => {
  const rewrites = readVercelRewrites(path);
  return requiredGoogleAuthRewrites
    .filter(([source, destination]) =>
      !rewrites.some((rewrite) => rewrite.source === source && rewrite.destination === destination)
    )
    .map(([source, destination]) => `${path} must rewrite ${source} to ${destination}`);
});

if (mismatches.length > 0) {
  console.error('Web app API mirror files are out of sync:');
  for (const [source, copy] of mismatches) {
    console.error(`- ${copy} must match ${source}`);
  }
  process.exit(1);
}

if (restoredV1Rules.length > 0) {
  console.error('Duplicate v1 API entrypoints are restored in the frontend deployment:');
  for (const rule of restoredV1Rules) {
    console.error(`- .vercelignore must remove ${rule}`);
  }
  process.exit(1);
}

if (missingRewriteMessages.length > 0) {
  console.error('Google auth API route rewrites are missing:');
  for (const message of missingRewriteMessages) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log('web api mirror check ok');
