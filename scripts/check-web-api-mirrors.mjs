import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const mirroredFiles = [
  ['api/_lib/http.js', 'apps/MoneyKai-web/api/_lib/http.js'],
  ['api/_lib/google-oauth.js', 'apps/MoneyKai-web/api/_lib/google-oauth.js'],
  ['api/_lib/firebase-identity.js', 'apps/MoneyKai-web/api/_lib/firebase-identity.js'],
  ['api/v1/auth/google/start.js', 'apps/MoneyKai-web/api/v1/auth/google/start.js'],
  ['api/v1/auth/google/callback.js', 'apps/MoneyKai-web/api/v1/auth/google/callback.js'],
  ['api/v1/auth/google/exchange.js', 'apps/MoneyKai-web/api/v1/auth/google/exchange.js'],
];

const hashFile = (path) =>
  createHash('sha256')
    .update(readFileSync(path))
    .digest('hex');

const mismatches = mirroredFiles.filter(([source, copy]) => hashFile(source) !== hashFile(copy));
const vercelIgnore = readFileSync('.vercelignore', 'utf8');
const requiredVercelIgnoreRules = [
  '!api/v1/',
  '!api/v1/auth/',
  '!api/v1/auth/google/',
  '!api/v1/auth/google/**',
];
const missingVercelIgnoreRules = requiredVercelIgnoreRules.filter(
  (rule) => !vercelIgnore.split(/\r?\n/).includes(rule)
);

if (mismatches.length > 0) {
  console.error('Web app API mirror files are out of sync:');
  for (const [source, copy] of mismatches) {
    console.error(`- ${copy} must match ${source}`);
  }
  process.exit(1);
}

if (missingVercelIgnoreRules.length > 0) {
  console.error('Google auth API routes are still hidden from the Vercel deployment:');
  for (const rule of missingVercelIgnoreRules) {
    console.error(`- .vercelignore must include ${rule}`);
  }
  process.exit(1);
}

console.log('web api mirror check ok');
